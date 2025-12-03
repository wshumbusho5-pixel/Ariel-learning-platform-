from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.progress import ReviewCard, ReviewSubmission, StudyStats
from app.models.user import User
from app.services.progress_repository import ProgressRepository
from app.api.auth import get_current_user_dependency

router = APIRouter()

@router.post("/cards", response_model=ReviewCard)
async def create_review_card(
    question_id: str,
    question_text: str,
    correct_answer: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Create a new review card for spaced repetition"""
    try:
        card = await ProgressRepository.create_card(
            user_id=current_user.id,
            question_id=question_id,
            question_text=question_text,
            correct_answer=correct_answer
        )
        return card
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cards/due", response_model=List[ReviewCard])
async def get_due_cards(
    limit: int = 20,
    current_user: User = Depends(get_current_user_dependency)
):
    """Get cards due for review today"""
    try:
        cards = await ProgressRepository.get_due_cards(current_user.id, limit)
        return cards
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reviews", response_model=ReviewCard)
async def submit_review(
    submission: ReviewSubmission,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Submit a review for a card
    Quality scale (SM-2):
    0 = Complete blackout
    1 = Incorrect, but remembered
    2 = Incorrect, but easy to recall
    3 = Correct, but difficult
    4 = Correct, with hesitation
    5 = Perfect recall
    """
    try:
        updated_card = await ProgressRepository.submit_review(current_user.id, submission)
        return updated_card
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=StudyStats)
async def get_study_stats(
    current_user: User = Depends(get_current_user_dependency)
):
    """Get user's study statistics and progress"""
    try:
        stats = await ProgressRepository.get_user_stats(current_user.id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
