"""
Comment Models - Comments and discussions on decks
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class Comment(BaseModel):
    """
    Comment on a deck
    """
    id: Optional[str] = None
    deck_id: str  # Which deck this comment is on
    user_id: str  # Who posted the comment

    # Content
    content: str  # Comment text
    parent_comment_id: Optional[str] = None  # For replies/threading

    # Engagement
    likes: int = 0
    liked_by: List[str] = []  # User IDs who liked this comment

    # Metadata
    is_edited: bool = False
    edited_at: Optional[datetime] = None
    is_deleted: bool = False  # Soft delete
    deleted_at: Optional[datetime] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CommentWithAuthor(BaseModel):
    """
    Comment with author information for display
    """
    id: str
    deck_id: str
    user_id: str
    content: str
    parent_comment_id: Optional[str] = None

    # Author info
    author_username: Optional[str]
    author_full_name: Optional[str]
    author_profile_picture: Optional[str]
    author_is_verified: bool

    # Engagement
    likes: int
    is_liked_by_current_user: bool

    # Reply count
    reply_count: int

    # Metadata
    is_edited: bool
    edited_at: Optional[datetime]
    is_author: bool  # Is current user the author

    # Timestamps
    created_at: datetime


class CommentCreate(BaseModel):
    """
    Request to create a comment
    """
    content: str
    parent_comment_id: Optional[str] = None


class CommentUpdate(BaseModel):
    """
    Request to update a comment
    """
    content: str
