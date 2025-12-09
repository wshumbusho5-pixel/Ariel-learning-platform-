"""
Story Model - 24-hour expiring status updates (Instagram Stories style)
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from enum import Enum


class StoryType(str, Enum):
    TEXT = "text"  # Simple text post
    ACHIEVEMENT = "achievement"  # Achievement badge share
    STREAK = "streak"  # Streak milestone
    DECK_POST = "deck_post"  # Share that you posted a deck
    STUDY_SESSION = "study_session"  # Share study session completion


class StoryVisibility(str, Enum):
    FOLLOWERS = "followers"  # Only followers see
    FRIENDS = "friends"  # Mutual followers
    PUBLIC = "public"  # Everyone


class Story(BaseModel):
    id: Optional[str] = None
    user_id: str

    # Content
    story_type: StoryType
    content: str  # Main text content
    background_color: Optional[str] = "#667EEA"  # Hex color for background

    # Media (optional)
    image_url: Optional[str] = None

    # Achievement data (if type = achievement)
    achievement_id: Optional[str] = None
    achievement_title: Optional[str] = None
    achievement_icon: Optional[str] = None

    # Streak data (if type = streak)
    streak_count: Optional[int] = None

    # Deck data (if type = deck_post)
    deck_id: Optional[str] = None
    deck_title: Optional[str] = None
    deck_subject: Optional[str] = None

    # Study session data (if type = study_session)
    cards_reviewed: Optional[int] = None
    time_spent_minutes: Optional[int] = None

    # Social
    visibility: StoryVisibility = StoryVisibility.FOLLOWERS
    views: int = 0
    viewers: List[str] = []  # List of user IDs who viewed

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=24))
    is_expired: bool = False

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class StoryCreate(BaseModel):
    story_type: StoryType
    content: str
    background_color: Optional[str] = "#667EEA"
    image_url: Optional[str] = None

    # Optional achievement data
    achievement_id: Optional[str] = None
    achievement_title: Optional[str] = None
    achievement_icon: Optional[str] = None

    # Optional streak data
    streak_count: Optional[int] = None

    # Optional deck data
    deck_id: Optional[str] = None
    deck_title: Optional[str] = None
    deck_subject: Optional[str] = None

    # Optional study session data
    cards_reviewed: Optional[int] = None
    time_spent_minutes: Optional[int] = None

    visibility: StoryVisibility = StoryVisibility.FOLLOWERS


class StoryResponse(BaseModel):
    """Story with author info"""
    id: str
    user_id: str

    # Content
    story_type: StoryType
    content: str
    background_color: str
    image_url: Optional[str]

    # Type-specific data
    achievement_id: Optional[str]
    achievement_title: Optional[str]
    achievement_icon: Optional[str]
    streak_count: Optional[int]
    deck_id: Optional[str]
    deck_title: Optional[str]
    deck_subject: Optional[str]
    cards_reviewed: Optional[int]
    time_spent_minutes: Optional[int]

    # Social
    visibility: StoryVisibility
    views: int

    # Author info
    author_username: Optional[str]
    author_full_name: Optional[str]
    author_profile_picture: Optional[str]
    author_is_verified: bool

    # Context
    has_viewed: bool = False  # Did current user view this?

    # Metadata
    created_at: datetime
    expires_at: datetime
    time_remaining_hours: int  # Hours until expiry


class StoryView(BaseModel):
    """Record of a user viewing a story"""
    story_id: str
    user_id: str
    viewed_at: datetime = Field(default_factory=datetime.utcnow)


class StoryGroup(BaseModel):
    """Stories grouped by user (for carousel display)"""
    user_id: str
    username: Optional[str]
    full_name: Optional[str]
    profile_picture: Optional[str]
    is_verified: bool

    # Stories
    stories: List[StoryResponse]
    total_stories: int
    unviewed_count: int  # How many stories user hasn't seen

    # Latest story time
    latest_story_time: datetime


class StoryTemplate(BaseModel):
    """Pre-made templates for quick story creation"""
    template_type: StoryType
    title: str
    description: str
    background_color: str
    emoji: str
    example_text: str
