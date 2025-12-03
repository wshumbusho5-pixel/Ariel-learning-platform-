from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class QuestionSource(str, Enum):
    MANUAL = "manual"
    URL = "url"
    PDF = "pdf"
    OCR = "ocr"
    BULK_PASTE = "bulk_paste"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Question(BaseModel):
    id: Optional[str] = None
    question_text: str
    correct_answer: str
    explanation: Optional[str] = None
    detailed_explanation: Optional[str] = None
    source: QuestionSource
    source_url: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[DifficultyLevel] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "question_text": "What is the capital of France?",
                "correct_answer": "Paris",
                "explanation": "Paris has been the capital of France since 987 AD.",
                "source": "url",
                "subject": "Geography",
                "topic": "European Capitals"
            }
        }

class QuestionSet(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    questions: List[Question]
    source: QuestionSource
    source_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None

class UserProgress(BaseModel):
    user_id: str
    question_id: str
    viewed_at: datetime = Field(default_factory=datetime.utcnow)
    next_review_date: Optional[datetime] = None
    review_count: int = 0
