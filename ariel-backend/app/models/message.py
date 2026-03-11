"""
Message Models - Direct messaging between users
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    DECK_SHARE = "deck_share"  # Sharing a deck
    CARD_SHARE = "card_share"  # Sharing a specific card


class Message(BaseModel):
    """
    Direct message between two users
    """
    id: Optional[str] = None
    conversation_id: str  # Links to Conversation
    sender_id: str
    receiver_id: str

    # Content
    message_type: MessageType = MessageType.TEXT
    content: str
    image_url: Optional[str] = None

    # Shared content
    shared_deck_id: Optional[str] = None
    shared_card_id: Optional[str] = None

    # Reply threading
    reply_to_message_id: Optional[str] = None
    reply_to_content: Optional[str] = None
    reply_to_sender_username: Optional[str] = None

    # Reactions: {user_id: emoji}
    reactions: dict = {}

    # Status
    is_read: bool = False
    read_at: Optional[datetime] = None
    is_deleted_by_sender: bool = False
    is_deleted_by_receiver: bool = False

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Conversation(BaseModel):
    """
    Conversation thread between two users
    """
    id: Optional[str] = None
    participant_ids: List[str]  # Always 2 users (sorted for consistency)

    # Last message info
    last_message_content: Optional[str] = None
    last_message_sender_id: Optional[str] = None
    last_message_at: Optional[datetime] = None

    # Unread counts (per user)
    unread_count: dict = {}  # {user_id: count}

    # Status
    is_archived_by: List[str] = []  # User IDs who archived this conversation
    is_blocked_by: List[str] = []  # User IDs who blocked this conversation

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ConversationWithUser(BaseModel):
    """
    Conversation with other user's information
    """
    id: str
    other_user_id: str
    other_user_username: Optional[str]
    other_user_full_name: Optional[str]
    other_user_profile_picture: Optional[str]
    other_user_is_verified: bool
    other_user_last_seen: Optional[datetime] = None

    last_message_content: Optional[str]
    last_message_sender_id: Optional[str]
    last_message_at: Optional[datetime]
    unread_count: int
    is_archived: bool

    created_at: datetime
    updated_at: datetime


class MessageWithSender(BaseModel):
    """
    Message with sender information
    """
    id: str
    conversation_id: str
    sender_id: str
    receiver_id: str
    message_type: MessageType
    content: str
    image_url: Optional[str]
    shared_deck_id: Optional[str]
    shared_card_id: Optional[str]
    is_read: bool
    read_at: Optional[datetime]

    # Reply threading
    reply_to_message_id: Optional[str] = None
    reply_to_content: Optional[str] = None
    reply_to_sender_username: Optional[str] = None

    # Reactions
    reactions: dict = {}

    # Sender info
    sender_username: Optional[str]
    sender_full_name: Optional[str]
    sender_profile_picture: Optional[str]

    # Current user context
    is_sent_by_current_user: bool

    created_at: datetime


class MessageCreate(BaseModel):
    """
    Request to send a message
    """
    content: str
    message_type: MessageType = MessageType.TEXT
    image_url: Optional[str] = None
    shared_deck_id: Optional[str] = None
    shared_card_id: Optional[str] = None
    reply_to_message_id: Optional[str] = None
