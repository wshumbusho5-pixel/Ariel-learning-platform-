"""
Deck Model - Collections of cards that can be shared/posted
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DeckVisibility(str, Enum):
    PRIVATE = "private"  # Only you
    FRIENDS_ONLY = "friends_only"  # Only followers
    CLASSMATES_ONLY = "classmates_only"  # Same school/course
    SUBJECT_COMMUNITY = "subject_community"  # All studying this subject
    PUBLIC = "public"  # Everyone

class Deck(BaseModel):
    id: Optional[str] = None
    user_id: str

    # Basic Info
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None

    # Organization
    subject: str  # Required: Biology, Chemistry, etc.
    topic: Optional[str] = None  # Optional: Cell Division, Organic Reactions
    education_level: Optional[str] = None  # high-school, university, etc.
    course_code: Optional[str] = None  # e.g., "BIO 101"
    tags: List[str] = []

    # Content
    card_ids: List[str] = []  # List of card IDs in this deck
    card_count: int = 0

    # Social
    visibility: DeckVisibility = DeckVisibility.PRIVATE
    is_featured: bool = False  # Admin can feature quality decks
    caption: Optional[str] = None  # Short message shown in feed when posted publicly

    # Engagement
    likes: int = 0
    saves: int = 0  # How many people saved/forked this deck
    views: int = 0
    comments_count: int = 0

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None  # When visibility changed from private

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DeckCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject: str
    topic: Optional[str] = None
    education_level: Optional[str] = None
    course_code: Optional[str] = None
    tags: List[str] = []
    visibility: DeckVisibility = DeckVisibility.PRIVATE
    card_ids: List[str] = []
    caption: Optional[str] = None

class DeckUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    education_level: Optional[str] = None
    course_code: Optional[str] = None
    tags: Optional[List[str]] = None
    visibility: Optional[DeckVisibility] = None
    card_ids: Optional[List[str]] = None
    caption: Optional[str] = None

class DeckPost(BaseModel):
    """Response when getting a deck in social feed"""
    id: str
    user_id: str
    title: str
    description: Optional[str]
    cover_image: Optional[str]
    subject: str
    topic: Optional[str]
    education_level: Optional[str]
    course_code: Optional[str]
    tags: List[str]
    card_count: int
    visibility: DeckVisibility
    is_featured: bool

    # Engagement
    likes: int
    saves: int
    views: int
    comments_count: int

    # User info (embedded)
    author_username: Optional[str]
    author_full_name: Optional[str]
    author_profile_picture: Optional[str]
    author_is_teacher: bool
    author_is_verified: bool

    # Social context
    is_liked: bool = False
    is_saved: bool = False
    caption: Optional[str] = None

    created_at: datetime
    published_at: Optional[datetime]

class DeckComment(BaseModel):
    id: Optional[str] = None
    deck_id: str
    user_id: str
    content: str
    likes: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # User info (embedded when fetching)
    author_username: Optional[str] = None
    author_full_name: Optional[str] = None
    author_profile_picture: Optional[str] = None
