from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CardVisibility(str, Enum):
    PRIVATE = "private"  # Only you
    CLASS = "class"      # Shared with class/group
    PUBLIC = "public"    # Everyone can see (trending feed)

class Card(BaseModel):
    id: Optional[str] = None
    user_id: str
    question: str
    answer: str
    explanation: Optional[str] = None

    # Organization
    subject: Optional[str] = None  # e.g., "Mathematics", "Biology"
    topic: Optional[str] = None    # e.g., "Algebra", "Cell Division"
    tags: List[str] = []           # e.g., ["midterm", "chapter-5"]

    # Caption (set when deck is created/published)
    caption: Optional[str] = None

    # Social features
    visibility: CardVisibility = CardVisibility.PRIVATE
    class_id: Optional[str] = None  # If shared with a class
    likes: int = 0
    saves: int = 0  # How many people saved this card to their deck

    # Spaced repetition data
    review_count: int = 0
    ease_factor: float = 2.5
    interval: int = 0
    next_review: Optional[datetime] = None
    last_review: Optional[datetime] = None

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class CardCreate(BaseModel):
    question: str
    answer: str
    explanation: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    tags: List[str] = []
    visibility: CardVisibility = CardVisibility.PRIVATE
    class_id: Optional[str] = None

class CardUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    explanation: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[List[str]] = None
    visibility: Optional[CardVisibility] = None

class CardReview(BaseModel):
    """Response after reviewing a card"""
    card_id: str
    quality: int  # 0-5 rating
    points_earned: int
    next_review: datetime

class DeckStats(BaseModel):
    """Statistics about user's card deck"""
    total_cards: int
    new_cards: int
    due_today: int
    mastered: int
    by_subject: dict
    by_topic: dict

class BulkCardCreate(BaseModel):
    """Create multiple cards at once from question set"""
    cards: List[CardCreate]
    subject: Optional[str] = None
    topic: Optional[str] = None
    tags: List[str] = []
    visibility: CardVisibility = CardVisibility.PRIVATE
    caption: Optional[str] = None
