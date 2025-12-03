from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.services.spaced_repetition import ReviewQuality

class ReviewCard(BaseModel):
    """A single question card for spaced repetition"""
    id: Optional[str] = None
    user_id: str
    question_id: str
    question_text: str
    correct_answer: str

    # Spaced repetition data
    repetitions: int = 0
    easiness_factor: float = 2.5
    interval_days: int = 0
    next_review_date: datetime = Field(default_factory=datetime.utcnow)

    # Performance tracking
    total_reviews: int = 0
    correct_reviews: int = 0
    last_review_date: Optional[datetime] = None
    last_review_quality: Optional[int] = None

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "question_id": "q456",
                "question_text": "What is the capital of France?",
                "correct_answer": "Paris"
            }
        }

class ReviewSubmission(BaseModel):
    """User's review submission"""
    card_id: str
    quality: ReviewQuality
    time_spent_seconds: Optional[int] = None

class ReviewSession(BaseModel):
    """A study session"""
    id: Optional[str] = None
    user_id: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    cards_reviewed: int = 0
    cards_correct: int = 0
    total_time_seconds: int = 0
    is_active: bool = True

class DailyProgress(BaseModel):
    """Daily progress summary"""
    user_id: str
    date: datetime
    cards_reviewed: int = 0
    cards_correct: int = 0
    new_cards_learned: int = 0
    time_studied_seconds: int = 0
    streak_day: int = 0

class StudyStats(BaseModel):
    """Overall study statistics"""
    total_cards: int
    cards_due_today: int
    cards_mastered: int  # Cards with repetitions >= 5
    retention_rate: float
    current_streak: int
    longest_streak: int
    total_study_time_hours: float
    cards_by_difficulty: dict
