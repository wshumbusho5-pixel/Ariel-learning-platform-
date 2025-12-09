"""
Messages API - Direct messaging between users
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime

from app.core.database import get_database
from app.core.security import get_current_user
from app.models.user import User
from app.models.message import (
    Message, Conversation, ConversationWithUser,
    MessageWithSender, MessageCreate, MessageType
)
from app.api.notifications import create_notification
from app.models.notification import NotificationType

router = APIRouter(prefix="/api/messages", tags=["messages"])


# ============== CONVERSATIONS ==============

@router.get("/conversations", response_model=List[ConversationWithUser])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    include_archived: bool = False
):
    """
    Get all conversations for current user

    - Returns conversations with other user's info
    - Sorted by last_message_at descending
    - Optionally include archived conversations
    """
    current_user_id = str(current_user.id)

    # Build query
    query = {"participant_ids": current_user_id}

    if not include_archived:
        query["is_archived_by"] = {"$ne": current_user_id}

    # Get conversations
    conversations = []
    async for convo in db.conversations.find(query).sort("last_message_at", -1):
        # Get other user's ID
        other_user_id = next(uid for uid in convo["participant_ids"] if uid != current_user_id)

        # Get other user's info
        other_user = await db.users.find_one({"_id": other_user_id})

        if not other_user:
            continue

        # Get unread count for current user
        unread_count = convo.get("unread_count", {}).get(current_user_id, 0)

        # Check if archived
        is_archived = current_user_id in convo.get("is_archived_by", [])

        conversations.append(ConversationWithUser(
            id=str(convo["_id"]),
            other_user_id=other_user_id,
            other_user_username=other_user.get("username"),
            other_user_full_name=other_user.get("full_name"),
            other_user_profile_picture=other_user.get("profile_picture"),
            other_user_is_verified=other_user.get("is_verified", False),
            last_message_content=convo.get("last_message_content"),
            last_message_sender_id=convo.get("last_message_sender_id"),
            last_message_at=convo.get("last_message_at"),
            unread_count=unread_count,
            is_archived=is_archived,
            created_at=convo["created_at"],
            updated_at=convo["updated_at"]
        ))

    return conversations


@router.get("/conversation/{other_user_id}")
async def get_or_create_conversation(
    other_user_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get existing conversation or create new one with another user

    - Returns conversation_id
    """
    current_user_id = str(current_user.id)

    if current_user_id == other_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot message yourself"
        )

    # Check if other user exists
    other_user = await db.users.find_one({"_id": other_user_id})
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Sort participant IDs for consistency
    participant_ids = sorted([current_user_id, other_user_id])

    # Find existing conversation
    conversation = await db.conversations.find_one({
        "participant_ids": participant_ids
    })

    if conversation:
        return {"conversation_id": str(conversation["_id"])}

    # Create new conversation
    new_conversation = Conversation(
        participant_ids=participant_ids,
        unread_count={current_user_id: 0, other_user_id: 0}
    )

    result = await db.conversations.insert_one(new_conversation.dict(exclude={"id"}))

    return {"conversation_id": str(result.inserted_id)}


# ============== MESSAGES ==============

@router.get("/conversation/{conversation_id}/messages", response_model=List[MessageWithSender])
async def get_conversation_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    limit: int = 50,
    offset: int = 0
):
    """
    Get messages in a conversation

    - Validates user is participant
    - Returns messages with sender info
    - Sorted by created_at descending (newest first)
    - Marks messages as read
    """
    current_user_id = str(current_user.id)

    # Validate conversation and participation
    conversation = await db.conversations.find_one({"_id": conversation_id})

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    if current_user_id not in conversation["participant_ids"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this conversation"
        )

    # Get messages
    messages = []
    async for message in db.messages.find({
        "conversation_id": conversation_id,
        f"is_deleted_by_{'sender' if message.get('sender_id') == current_user_id else 'receiver'}": False
    }).sort("created_at", -1).skip(offset).limit(limit):

        # Get sender info
        sender = await db.users.find_one({"_id": message["sender_id"]})

        if not sender:
            continue

        messages.append(MessageWithSender(
            id=str(message["_id"]),
            conversation_id=message["conversation_id"],
            sender_id=message["sender_id"],
            receiver_id=message["receiver_id"],
            message_type=message.get("message_type", MessageType.TEXT),
            content=message["content"],
            image_url=message.get("image_url"),
            shared_deck_id=message.get("shared_deck_id"),
            shared_card_id=message.get("shared_card_id"),
            is_read=message.get("is_read", False),
            read_at=message.get("read_at"),
            sender_username=sender.get("username"),
            sender_full_name=sender.get("full_name"),
            sender_profile_picture=sender.get("profile_picture"),
            is_sent_by_current_user=(message["sender_id"] == current_user_id),
            created_at=message["created_at"]
        ))

    # Mark unread messages as read
    await db.messages.update_many(
        {
            "conversation_id": conversation_id,
            "receiver_id": current_user_id,
            "is_read": False
        },
        {
            "$set": {
                "is_read": True,
                "read_at": datetime.utcnow()
            }
        }
    )

    # Reset unread count for current user
    await db.conversations.update_one(
        {"_id": conversation_id},
        {"$set": {f"unread_count.{current_user_id}": 0}}
    )

    return messages


@router.post("/conversation/{conversation_id}/send", response_model=MessageWithSender)
async def send_message(
    conversation_id: str,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Send a message in a conversation

    - Validates user is participant
    - Updates conversation's last_message
    - Increments receiver's unread count
    - Sends notification to receiver
    """
    current_user_id = str(current_user.id)

    # Validate conversation and participation
    conversation = await db.conversations.find_one({"_id": conversation_id})

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    if current_user_id not in conversation["participant_ids"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to send messages in this conversation"
        )

    # Get receiver ID
    receiver_id = next(uid for uid in conversation["participant_ids"] if uid != current_user_id)

    # Create message
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user_id,
        receiver_id=receiver_id,
        message_type=message_data.message_type,
        content=message_data.content,
        image_url=message_data.image_url,
        shared_deck_id=message_data.shared_deck_id,
        shared_card_id=message_data.shared_card_id
    )

    result = await db.messages.insert_one(message.dict(exclude={"id"}))
    message_id = str(result.inserted_id)

    # Update conversation
    unread_count = conversation.get("unread_count", {})
    unread_count[receiver_id] = unread_count.get(receiver_id, 0) + 1

    await db.conversations.update_one(
        {"_id": conversation_id},
        {
            "$set": {
                "last_message_content": message_data.content[:100],
                "last_message_sender_id": current_user_id,
                "last_message_at": datetime.utcnow(),
                "unread_count": unread_count,
                "updated_at": datetime.utcnow()
            }
        }
    )

    # Send notification to receiver
    await create_notification(
        db=db,
        user_id=receiver_id,
        notification_type=NotificationType.NEW_MESSAGE,
        actor_id=current_user_id,
        metadata={"message_preview": message_data.content[:100]}
    )

    # Return message with sender info
    sender = await db.users.find_one({"_id": current_user_id})

    return MessageWithSender(
        id=message_id,
        conversation_id=conversation_id,
        sender_id=current_user_id,
        receiver_id=receiver_id,
        message_type=message_data.message_type,
        content=message_data.content,
        image_url=message_data.image_url,
        shared_deck_id=message_data.shared_deck_id,
        shared_card_id=message_data.shared_card_id,
        is_read=False,
        read_at=None,
        sender_username=sender.get("username"),
        sender_full_name=sender.get("full_name"),
        sender_profile_picture=sender.get("profile_picture"),
        is_sent_by_current_user=True,
        created_at=message.created_at
    )


# ============== DELETE MESSAGE ==============

@router.delete("/message/{message_id}")
async def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Delete a message (soft delete)

    - Sender can delete for themselves
    - Receiver can delete for themselves
    """
    current_user_id = str(current_user.id)

    # Find message
    message = await db.messages.find_one({"_id": message_id})

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Determine delete field
    if message["sender_id"] == current_user_id:
        delete_field = "is_deleted_by_sender"
    elif message["receiver_id"] == current_user_id:
        delete_field = "is_deleted_by_receiver"
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this message"
        )

    # Soft delete
    await db.messages.update_one(
        {"_id": message_id},
        {"$set": {delete_field: True}}
    )

    return {"success": True, "message": "Message deleted"}


# ============== ARCHIVE/UNARCHIVE CONVERSATION ==============

@router.post("/conversation/{conversation_id}/archive")
async def toggle_archive_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Archive or unarchive a conversation
    """
    current_user_id = str(current_user.id)

    # Validate conversation
    conversation = await db.conversations.find_one({"_id": conversation_id})

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    if current_user_id not in conversation["participant_ids"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    # Toggle archive
    archived_by = conversation.get("is_archived_by", [])

    if current_user_id in archived_by:
        # Unarchive
        await db.conversations.update_one(
            {"_id": conversation_id},
            {"$pull": {"is_archived_by": current_user_id}}
        )
        return {"success": True, "action": "unarchived"}
    else:
        # Archive
        await db.conversations.update_one(
            {"_id": conversation_id},
            {"$addToSet": {"is_archived_by": current_user_id}}
        )
        return {"success": True, "action": "archived"}


# ============== UNREAD COUNT ==============

@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get total unread message count for current user
    """
    current_user_id = str(current_user.id)

    # Sum unread counts from all conversations
    total_unread = 0

    async for convo in db.conversations.find({"participant_ids": current_user_id}):
        unread_count = convo.get("unread_count", {}).get(current_user_id, 0)
        total_unread += unread_count

    return {"unread_count": total_unread}
