from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.models.card import Card, CardCreate, CardUpdate, DeckStats, BulkCardCreate, CardReview
from app.models.user import User
from app.services.card_repository import CardRepository
from app.services.gamification_service import GamificationService
from app.services.user_repository import UserRepository
from app.services.personalized_feed import personalized_feed_service
from app.api.auth import get_current_user_dependency

router = APIRouter()

@router.post("/", response_model=Card)
async def create_card(
    card_data: CardCreate,
    current_user: User = Depends(get_current_user_dependency)
):
    """Create a new flashcard"""
    try:
        card = await CardRepository.create_card(card_data, current_user.id)
        return card
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk", response_model=List[Card])
async def create_cards_bulk(
    bulk_data: BulkCardCreate,
    current_user: User = Depends(get_current_user_dependency)
):
    """Create multiple flashcards at once (from question set)"""
    try:
        # Apply default subject/topic/tags if provided
        cards_data = []
        for card in bulk_data.cards:
            if bulk_data.subject and not card.subject:
                card.subject = bulk_data.subject
            if bulk_data.topic and not card.topic:
                card.topic = bulk_data.topic
            if bulk_data.tags:
                card.tags = list(set(card.tags + bulk_data.tags))
            cards_data.append(card)

        cards = await CardRepository.create_cards_bulk(cards_data, current_user.id)

        # Award points for creating cards
        points_earned = len(cards) * GamificationService.POINTS_NEW_CARD
        await UserRepository.update_user(
            current_user.id,
            {"total_points": current_user.total_points + points_earned}
        )

        return cards
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-deck", response_model=List[Card])
async def get_my_cards(
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    limit: int = 100,
    skip: int = 0,
    current_user: User = Depends(get_current_user_dependency)
):
    """Get your personal cards with optional filters"""
    try:
        cards = await CardRepository.get_user_cards(
            current_user.id,
            subject=subject,
            topic=topic,
            tags=tags,
            limit=limit,
            skip=skip
        )
        return cards
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/due", response_model=List[Card])
async def get_due_cards(
    limit: int = 20,
    current_user: User = Depends(get_current_user_dependency)
):
    """Get cards due for review (spaced repetition queue)"""
    try:
        cards = await CardRepository.get_due_cards(current_user.id, limit)
        return cards
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trending", response_model=List[Card])
async def get_trending_cards(
    limit: int = 50,
    current_user: User = Depends(get_current_user_dependency)
):
    """Get trending public cards (Explore feed)"""
    try:
        cards = await CardRepository.get_trending_cards(limit)
        return cards
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/personalized-feed", response_model=List[Card])
async def get_personalized_feed(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Get personalized feed for user based on their profile.

    Feed Mix Algorithm:
    - 50% User's enrolled subjects
    - 20% Based on search/question history
    - 15% Spaced repetition (due cards)
    - 10% Trending in user's subjects
    - 5% Discover (new topics)
    """
    try:
        feed = await personalized_feed_service.get_personalized_feed(
            user=current_user,
            limit=limit,
            offset=offset
        )
        return feed
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feed-insights")
async def get_feed_insights(
    current_user: User = Depends(get_current_user_dependency)
):
    """Get insights about user's personalized feed composition"""
    try:
        insights = await personalized_feed_service.get_feed_insights(current_user)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=DeckStats)
async def get_deck_stats(
    current_user: User = Depends(get_current_user_dependency)
):
    """Get statistics about your deck"""
    try:
        stats = await CardRepository.get_deck_stats(current_user.id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{card_id}", response_model=Card)
async def get_card(
    card_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Get a specific card"""
    card = await CardRepository.get_card(card_id, current_user.id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

@router.put("/{card_id}", response_model=Card)
async def update_card(
    card_id: str,
    update_data: CardUpdate,
    current_user: User = Depends(get_current_user_dependency)
):
    """Update a card"""
    card = await CardRepository.update_card(card_id, current_user.id, update_data)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found or not owned by you")
    return card

@router.delete("/{card_id}")
async def delete_card(
    card_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Delete a card"""
    success = await CardRepository.delete_card(card_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Card not found or not owned by you")
    return {"success": True, "message": "Card deleted"}

@router.post("/{card_id}/review", response_model=CardReview)
async def review_card(
    card_id: str,
    quality: int = Query(..., ge=0, le=5, description="Quality rating 0-5"),
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Review a card and update spaced repetition
    quality: 0=total blackout, 1=wrong, 2=hard, 3=good, 4=easy, 5=perfect
    """
    try:
        card = await CardRepository.review_card(card_id, current_user.id, quality)
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")

        # Award points based on quality
        points = GamificationService.calculate_points_for_review(quality, quality == 5)

        await UserRepository.update_user(
            current_user.id,
            {"total_points": current_user.total_points + points}
        )

        return CardReview(
            card_id=card.id,
            quality=quality,
            points_earned=points,
            next_review=card.next_review
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{card_id}/like")
async def like_card(
    card_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Like a card"""
    success = await CardRepository.like_card(card_id)
    if not success:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"success": True, "message": "Card liked"}

@router.post("/{card_id}/save", response_model=Card)
async def save_card_to_deck(
    card_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Save someone else's public card to your deck"""
    card = await CardRepository.save_card(card_id, current_user.id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found or is private")
    return card
