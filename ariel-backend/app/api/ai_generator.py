from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.user import User
from app.models.card import Card
from app.services.ai_card_generator import ai_card_generator
from app.api.auth import get_current_user_dependency

router = APIRouter(prefix="/api/ai", tags=["AI Card Generator"])


class GenerateCardsRequest(BaseModel):
    """Request to generate cards for a specific subject"""
    subject: str
    num_cards: int = 10
    topic: Optional[str] = None


class GenerateDailyCardsRequest(BaseModel):
    """Request to generate daily cards for all subjects"""
    cards_per_subject: int = 5


class GenerateExamPrepRequest(BaseModel):
    """Request to generate exam preparation cards"""
    subject: str
    exam_date: Optional[datetime] = None
    num_cards: int = 20


@router.post("/generate/subject", response_model=List[Card])
async def generate_cards_for_subject(
    request: GenerateCardsRequest,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Generate personalized flashcards for a specific subject.

    Uses user's education profile (level, subjects, goals) to create
    curriculum-appropriate content with GPT-4.
    """

    # Validate user has education profile
    if not current_user.education_level:
        raise HTTPException(
            status_code=400,
            detail="Please complete your education profile first (onboarding required)"
        )

    try:
        cards = await ai_card_generator.generate_cards_for_subject(
            user=current_user,
            subject=request.subject,
            num_cards=request.num_cards,
            topic=request.topic
        )

        return cards

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate cards: {str(e)}"
        )


@router.post("/generate/daily")
async def generate_daily_cards(
    request: GenerateDailyCardsRequest,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Generate daily personalized cards for all user's subjects.

    Creates fresh content every day based on enrolled subjects.
    Perfect for daily study routine.
    """

    if not current_user.education_level or not current_user.subjects:
        raise HTTPException(
            status_code=400,
            detail="Please complete your education profile and select subjects first"
        )

    try:
        results = await ai_card_generator.generate_daily_cards(
            user=current_user,
            cards_per_subject=request.cards_per_subject
        )

        # Format response
        total_cards = sum(len(cards) for cards in results.values())

        return {
            "success": True,
            "subjects": list(results.keys()),
            "cards_by_subject": {
                subject: [card.dict() for card in cards]
                for subject, cards in results.items()
            },
            "total_cards": total_cards,
            "message": f"Generated {total_cards} cards across {len(results)} subjects"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate daily cards: {str(e)}"
        )


@router.post("/generate/exam-prep", response_model=List[Card])
async def generate_exam_prep_cards(
    request: GenerateExamPrepRequest,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Generate exam preparation flashcards.

    Creates challenging, exam-focused content with increased difficulty.
    Optionally tailored to exam date for time-based preparation.
    """

    if not current_user.education_level:
        raise HTTPException(
            status_code=400,
            detail="Please complete your education profile first"
        )

    try:
        cards = await ai_card_generator.generate_exam_prep_cards(
            user=current_user,
            subject=request.subject,
            exam_date=request.exam_date,
            num_cards=request.num_cards
        )

        return cards

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate exam prep cards: {str(e)}"
        )


@router.get("/subjects")
async def get_available_subjects(
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Get user's enrolled subjects for card generation.

    Returns subjects from user's education profile that can be used
    for AI card generation.
    """

    if not current_user.subjects:
        return {
            "subjects": [],
            "message": "No subjects enrolled. Complete onboarding to add subjects."
        }

    return {
        "subjects": current_user.subjects,
        "education_level": current_user.education_level,
        "year_level": current_user.year_level
    }
