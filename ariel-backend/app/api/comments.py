"""
Comments API - Comments and discussions on decks
"""
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from typing import List, Optional
from datetime import datetime

from app.services.database_service import db_service
from app.api.auth import get_current_user_dependency
from app.models.user import User
from app.models.comment import Comment, CommentWithAuthor, CommentCreate, CommentUpdate
from app.api.notifications import create_notification
from app.models.notification import NotificationType

router = APIRouter(prefix="/api/comments", tags=["comments"])


# ============== GET COMMENTS ==============

@router.get("/deck/{deck_id}", response_model=List[CommentWithAuthor])
async def get_deck_comments(
    deck_id: str,
    current_user: User = Depends(get_current_user_dependency),
    limit: int = 50,
    offset: int = 0,
    parent_only: bool = False
):
    """
    Get comments for a deck

    - Returns comments with author information
    - Supports pagination
    - parent_only: If true, only return top-level comments (no replies)
    - Sorted by created_at descending
    """
    db = db_service.get_db()
    current_user_id = str(current_user.id)

    # Build query
    query = {"deck_id": deck_id, "is_deleted": False}

    if parent_only:
        query["parent_comment_id"] = None

    # Get comments
    comments = []
    async for comment in db.comments.find(query).sort("created_at", -1).skip(offset).limit(limit):
        # Get author info
        author = await db.users.find_one({"_id": comment["user_id"]})

        if not author:
            continue

        # Count replies
        reply_count = await db.comments.count_documents({
            "parent_comment_id": str(comment["_id"]),
            "is_deleted": False
        })

        # Check if current user liked this comment
        is_liked = current_user_id in comment.get("liked_by", [])

        comments.append(CommentWithAuthor(
            id=str(comment["_id"]),
            deck_id=comment["deck_id"],
            user_id=comment["user_id"],
            content=comment["content"],
            parent_comment_id=comment.get("parent_comment_id"),
            author_username=author.get("username"),
            author_full_name=author.get("full_name"),
            author_profile_picture=author.get("profile_picture"),
            author_is_verified=author.get("is_verified", False),
            likes=comment.get("likes", 0),
            is_liked_by_current_user=is_liked,
            reply_count=reply_count,
            is_edited=comment.get("is_edited", False),
            edited_at=comment.get("edited_at"),
            is_author=(comment["user_id"] == current_user_id),
            created_at=comment["created_at"]
        ))

    return comments


@router.get("/{comment_id}/replies", response_model=List[CommentWithAuthor])
async def get_comment_replies(
    comment_id: str,
    current_user: User = Depends(get_current_user_dependency),
    limit: int = 50
):
    """
    Get replies to a specific comment
    """
    db = db_service.get_db()
    current_user_id = str(current_user.id)

    # Get replies
    replies = []
    async for comment in db.comments.find({
        "parent_comment_id": comment_id,
        "is_deleted": False
    }).sort("created_at", 1).limit(limit):  # Ascending for replies
        # Get author info
        author = await db.users.find_one({"_id": comment["user_id"]})

        if not author:
            continue

        # Check if current user liked this comment
        is_liked = current_user_id in comment.get("liked_by", [])

        replies.append(CommentWithAuthor(
            id=str(comment["_id"]),
            deck_id=comment["deck_id"],
            user_id=comment["user_id"],
            content=comment["content"],
            parent_comment_id=comment.get("parent_comment_id"),
            author_username=author.get("username"),
            author_full_name=author.get("full_name"),
            author_profile_picture=author.get("profile_picture"),
            author_is_verified=author.get("is_verified", False),
            likes=comment.get("likes", 0),
            is_liked_by_current_user=is_liked,
            reply_count=0,  # Replies don't show nested reply counts
            is_edited=comment.get("is_edited", False),
            edited_at=comment.get("edited_at"),
            is_author=(comment["user_id"] == current_user_id),
            created_at=comment["created_at"]
        ))

    return replies


# ============== CREATE COMMENT ==============

@router.post("/deck/{deck_id}", response_model=CommentWithAuthor)
async def create_comment(
    deck_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Create a comment on a deck

    - Can be a top-level comment or a reply (via parent_comment_id)
    - Notifies deck author and parent comment author
    """
    db = db_service.get_db()
    user_id = str(current_user.id)

    # Validate deck exists
    deck = await db.decks.find_one({"_id": deck_id})
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    # Validate parent comment if replying
    if comment_data.parent_comment_id:
        parent_comment = await db.comments.find_one({
            "_id": comment_data.parent_comment_id,
            "deck_id": deck_id,
            "is_deleted": False
        })
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found"
            )

    # Create comment
    comment = Comment(
        deck_id=deck_id,
        user_id=user_id,
        content=comment_data.content,
        parent_comment_id=comment_data.parent_comment_id
    )

    result = await db.comments.insert_one(comment.dict(exclude={"id"}))
    comment_id = str(result.inserted_id)

    # Send notifications
    # 1. Notify deck author (if not commenting on own deck)
    if deck["user_id"] != user_id and not comment_data.parent_comment_id:
        await create_notification(
            db=db,
            user_id=deck["user_id"],
            notification_type=NotificationType.DECK_COMMENT,
            actor_id=user_id,
            related_deck_id=deck_id,
            related_comment_id=comment_id,
            metadata={
                "comment_preview": comment_data.content[:100],
                "deck_title": deck.get("title", "your deck")
            }
        )

    # 2. Notify parent comment author (if replying and not replying to self)
    if comment_data.parent_comment_id:
        parent_comment = await db.comments.find_one({"_id": comment_data.parent_comment_id})
        if parent_comment and parent_comment["user_id"] != user_id:
            await create_notification(
                db=db,
                user_id=parent_comment["user_id"],
                notification_type=NotificationType.COMMENT_REPLY,
                actor_id=user_id,
                related_deck_id=deck_id,
                related_comment_id=comment_id,
                metadata={"comment_preview": comment_data.content[:100]}
            )

    # Return comment with author info
    author = await db.users.find_one({"_id": user_id})

    return CommentWithAuthor(
        id=comment_id,
        deck_id=deck_id,
        user_id=user_id,
        content=comment_data.content,
        parent_comment_id=comment_data.parent_comment_id,
        author_username=author.get("username"),
        author_full_name=author.get("full_name"),
        author_profile_picture=author.get("profile_picture"),
        author_is_verified=author.get("is_verified", False),
        likes=0,
        is_liked_by_current_user=False,
        reply_count=0,
        is_edited=False,
        edited_at=None,
        is_author=True,
        created_at=comment.created_at
    )


# ============== UPDATE COMMENT ==============

@router.put("/{comment_id}")
async def update_comment(
    comment_id: str,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Update a comment

    - Only author can update
    - Marks as edited
    """
    db = db_service.get_db()
    user_id = str(current_user.id)

    # Find comment
    comment = await db.comments.find_one({
        "_id": comment_id,
        "is_deleted": False
    })

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Check ownership
    if comment["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )

    # Update
    await db.comments.update_one(
        {"_id": comment_id},
        {
            "$set": {
                "content": comment_data.content,
                "is_edited": True,
                "edited_at": datetime.utcnow()
            }
        }
    )

    return {"success": True, "message": "Comment updated"}


# ============== DELETE COMMENT ==============

@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Delete a comment (soft delete)

    - Only author can delete
    - Also removes from deck's comment count
    """
    db = db_service.get_db()
    user_id = str(current_user.id)

    # Find comment
    comment = await db.comments.find_one({
        "_id": comment_id,
        "is_deleted": False
    })

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Check ownership
    if comment["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )

    # Soft delete
    await db.comments.update_one(
        {"_id": comment_id},
        {
            "$set": {
                "is_deleted": True,
                "deleted_at": datetime.utcnow()
            }
        }
    )

    return {"success": True, "message": "Comment deleted"}


# ============== LIKE COMMENT ==============

@router.post("/{comment_id}/like")
async def toggle_comment_like(
    comment_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Toggle like on a comment

    - If not liked, adds like
    - If already liked, removes like
    """
    db = db_service.get_db()
    user_id = str(current_user.id)

    # Find comment
    comment = await db.comments.find_one({
        "_id": comment_id,
        "is_deleted": False
    })

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Check if already liked
    liked_by = comment.get("liked_by", [])
    is_liked = user_id in liked_by

    if is_liked:
        # Unlike
        await db.comments.update_one(
            {"_id": comment_id},
            {
                "$pull": {"liked_by": user_id},
                "$inc": {"likes": -1}
            }
        )
        return {"success": True, "action": "unliked", "likes": comment.get("likes", 1) - 1}
    else:
        # Like
        await db.comments.update_one(
            {"_id": comment_id},
            {
                "$addToSet": {"liked_by": user_id},
                "$inc": {"likes": 1}
            }
        )
        return {"success": True, "action": "liked", "likes": comment.get("likes", 0) + 1}


# ============== CARD COMMENT ALIASES ==============
# Cards reuse the same comment system — card_id acts as deck_id

@router.get("/card/{card_id}", response_model=List[CommentWithAuthor])
async def get_card_comments(
    card_id: str,
    current_user: User = Depends(get_current_user_dependency),
    limit: int = 20,
    offset: int = 0,
):
    """Get comments for a card (reuses deck comment system)."""
    db = db_service.get_db()
    current_user_id = str(current_user.id)
    comments = []
    async for comment in db.comments.find(
        {"deck_id": card_id, "is_deleted": False, "parent_comment_id": None}
    ).sort("created_at", -1).skip(offset).limit(limit):
        try:
            author = await db.users.find_one({"_id": ObjectId(comment["user_id"])})
        except Exception:
            author = await db.users.find_one({"_id": comment["user_id"]})
        if not author:
            continue
        reply_count = await db.comments.count_documents({"parent_comment_id": str(comment["_id"]), "is_deleted": False})
        is_liked = current_user_id in comment.get("liked_by", [])
        comments.append(CommentWithAuthor(
            id=str(comment["_id"]),
            deck_id=comment["deck_id"],
            user_id=comment["user_id"],
            content=comment["content"],
            parent_comment_id=comment.get("parent_comment_id"),
            author_username=author.get("username"),
            author_full_name=author.get("full_name"),
            author_profile_picture=author.get("profile_picture"),
            author_is_verified=author.get("is_verified", False),
            likes=comment.get("likes", 0),
            is_liked_by_current_user=is_liked,
            reply_count=reply_count,
            is_edited=comment.get("is_edited", False),
            edited_at=comment.get("edited_at"),
            is_author=(comment["user_id"] == current_user_id),
            created_at=comment["created_at"]
        ))
    return comments


@router.post("/card/{card_id}", response_model=CommentWithAuthor)
async def create_card_comment(
    card_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user_dependency)
):
    """Post a comment on a card."""
    db = db_service.get_db()
    user_id = str(current_user.id)
    now = datetime.utcnow()
    comment_doc = {
        "deck_id": card_id,
        "user_id": user_id,
        "content": comment_data.content,
        "parent_comment_id": None,
        "likes": 0,
        "liked_by": [],
        "is_deleted": False,
        "is_edited": False,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.comments.insert_one(comment_doc)
    author = await db.users.find_one({"_id": user_id})
    return CommentWithAuthor(
        id=str(result.inserted_id),
        deck_id=card_id,
        user_id=user_id,
        content=comment_data.content,
        parent_comment_id=None,
        author_username=current_user.username,
        author_full_name=getattr(current_user, "full_name", None),
        author_profile_picture=getattr(current_user, "profile_picture", None),
        author_is_verified=getattr(current_user, "is_verified", False),
        likes=0,
        is_liked_by_current_user=False,
        reply_count=0,
        is_edited=False,
        edited_at=None,
        is_author=True,
        created_at=now,
    )


# ============== COMMENT COUNT ==============

@router.get("/deck/{deck_id}/count")
async def get_comment_count(
    deck_id: str
):
    """
    Get total comment count for a deck
    """
    db = db_service.get_db()
    count = await db.comments.count_documents({
        "deck_id": deck_id,
        "is_deleted": False
    })

    return {"deck_id": deck_id, "comment_count": count}
