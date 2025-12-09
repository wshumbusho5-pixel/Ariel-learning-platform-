"""
Activity Feed Models - Track user activities for social feed
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ActivityType(str, Enum):
    # Study activities
    CARDS_REVIEWED = "cards_reviewed"
    DECK_CREATED = "deck_created"
    STUDY_SESSION = "study_session"

    # Achievements
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"
    STREAK_MILESTONE = "streak_milestone"

    # Social
    FOLLOWED_USER = "followed_user"
    DECK_LIKED = "deck_liked"
    DECK_SAVED = "deck_saved"

    # Content
    STORY_POSTED = "story_posted"
    COMMENT_POSTED = "comment_posted"


class Activity(BaseModel):
    """
    User activity for feed
    """
    id: Optional[str] = None
    user_id: str  # Who performed the activity
    activity_type: ActivityType

    # Content
    title: str  # e.g., "John reviewed 50 cards"
    description: Optional[str] = None
    icon: Optional[str] = None

    # Related entities
    related_deck_id: Optional[str] = None
    related_achievement_id: Optional[str] = None
    related_user_id: Optional[str] = None  # For follows

    # Metadata
    metadata: Dict[str, Any] = {}  # Extra data like card count, streak days, etc.

    # Engagement
    likes: int = 0
    liked_by: list = []

    # Visibility
    is_public: bool = True

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityWithUser(BaseModel):
    """
    Activity with user information for display
    """
    id: str
    user_id: str
    activity_type: ActivityType
    title: str
    description: Optional[str]
    icon: Optional[str]

    # User info
    username: Optional[str]
    full_name: Optional[str]
    profile_picture: Optional[str]
    is_verified: bool

    # Related entities
    related_deck_id: Optional[str]
    related_achievement_id: Optional[str]
    related_user_id: Optional[str]

    metadata: Dict[str, Any]

    # Engagement
    likes: int
    is_liked_by_current_user: bool

    created_at: datetime
