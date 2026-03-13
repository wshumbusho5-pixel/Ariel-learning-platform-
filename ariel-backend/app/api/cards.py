import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from bson import ObjectId

logger = logging.getLogger(__name__)
from app.models.card import Card, CardCreate, CardUpdate, DeckStats, BulkCardCreate, CardReview
from app.models.user import User
from app.models.activity import ActivityType
from app.services.card_repository import CardRepository
from app.services.gamification_service import GamificationService
from app.services.user_repository import UserRepository
from app.services.personalized_feed import personalized_feed_service
from app.api.auth import get_current_user_dependency, get_optional_user_dependency
from app.services.database_service import db_service
from app.core.database import get_database
from app.api.activity_feed import create_activity

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
    current_user: User = Depends(get_current_user_dependency),
    db = Depends(get_database)
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
            # Apply bulk visibility to each card
            card.visibility = bulk_data.visibility
            cards_data.append(card)

        cards = await CardRepository.create_cards_bulk(cards_data, current_user.id)

        # Award points for creating cards
        points_earned = len(cards) * GamificationService.POINTS_NEW_CARD
        await UserRepository.update_user(
            current_user.id,
            {"total_points": current_user.total_points + points_earned}
        )

        # Create activity for deck creation
        if len(cards) >= 5:  # Only create activity if creating significant number of cards
            await create_activity(
                db=db,
                user_id=current_user.id,
                activity_type=ActivityType.DECK_CREATED,
                title=f"{current_user.username} created a new deck",
                description=f"created a deck with {len(cards)} cards",
                icon="🎨",
                metadata={"count": len(cards), "subject": bulk_data.subject or "General"}
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

@router.get("/search", response_model=List[Card])
async def search_cards(
    q: str,
    limit: int = 30,
    current_user: User = Depends(get_optional_user_dependency)
):
    """Full-text search across public cards"""
    if not q or len(q.strip()) < 2:
        return []
    try:
        db = db_service.get_db()
        keyword = q.strip()
        regex = {"$regex": keyword, "$options": "i"}
        cursor = db["cards"].find(
            {"visibility": "public", "$or": [
                {"question": regex},
                {"answer": regex},
                {"subject": regex},
                {"topic": regex},
                {"tags": regex},
            ]},
            limit=limit
        )
        docs = await cursor.to_list(length=limit)
        cards = []
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
            doc.setdefault("user_id", doc.get("created_by") or "system")
            try:
                cards.append(Card(**doc))
            except Exception:
                pass
        return cards
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trending")
async def get_trending_cards(
    limit: int = 50,
    current_user: User = Depends(get_current_user_dependency),
    db = Depends(get_database)
):
    """Get trending public cards enriched with creator info."""
    try:
        cards = await CardRepository.get_trending_cards(limit)
        user_cache: dict = {}

        async def get_user(uid: str):
            if uid not in user_cache:
                u = await db.users.find_one({"_id": ObjectId(uid)})
                user_cache[uid] = u
            return user_cache[uid]

        enriched = []
        for card in cards:
            card_dict = card.dict()
            creator = await get_user(card.user_id)
            if creator:
                card_dict["created_by"] = {
                    "id": str(creator["_id"]),
                    "username": creator.get("username", "unknown"),
                    "full_name": creator.get("full_name"),
                    "profile_picture": creator.get("profile_picture"),
                    "is_verified": creator.get("is_verified", False),
                }
            enriched.append(card_dict)
        return enriched
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/personalized-feed")
async def get_personalized_feed(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user_dependency),
    db = Depends(get_database)
):
    """Get personalized feed enriched with creator info."""
    try:
        feed = await personalized_feed_service.get_personalized_feed(
            user=current_user,
            limit=limit,
            offset=offset
        )

        # Cache user lookups
        user_cache: dict = {}

        async def get_user(uid: str):
            if uid not in user_cache:
                u = await db.users.find_one({"_id": ObjectId(uid)})
                user_cache[uid] = u
            return user_cache[uid]

        # Gather all card ids for a single community-stats aggregation
        card_ids = [str(card.id) for card in feed]

        # Aggregate review stats across all users for these cards
        stats_map: dict = {}
        try:
            pipeline = [
                {"$match": {"card_id": {"$in": card_ids}}},
                {"$group": {
                    "_id": "$card_id",
                    "total": {"$sum": 1},
                    "correct": {"$sum": {"$cond": [{"$gte": ["$quality", 4]}, 1, 0]}}
                }}
            ]
            async for doc in db.card_reviews.aggregate(pipeline):
                stats_map[doc["_id"]] = {
                    "total_reviews": doc["total"],
                    "pct_correct": round(doc["correct"] / doc["total"] * 100) if doc["total"] else 0
                }
        except Exception:
            pass

        enriched = []
        for card in feed:
            card_dict = card.dict()
            creator = await get_user(card.user_id)
            if creator:
                card_dict["created_by"] = {
                    "id": str(creator["_id"]),
                    "username": creator.get("username", "unknown"),
                    "full_name": creator.get("full_name"),
                    "profile_picture": creator.get("profile_picture"),
                    "is_verified": creator.get("is_verified", False),
                }
            # Attach community stats
            cstats = stats_map.get(str(card.id))
            if cstats:
                card_dict["community_reviews"] = cstats["total_reviews"]
                card_dict["community_pct_correct"] = cstats["pct_correct"]
            enriched.append(card_dict)

        return enriched
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/following-feed")
async def get_following_feed(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user_dependency),
    db = Depends(get_database)
):
    """Get cards from people the current user follows."""
    try:
        following_ids = current_user.following or []
        if not following_ids:
            return []

        # Convert to ObjectIds
        oid_list = []
        for fid in following_ids:
            try:
                oid_list.append(ObjectId(fid))
            except Exception:
                pass

        if not oid_list:
            return []

        cursor = db.cards.find({
            "user_id": {"$in": [str(fid) for fid in following_ids]},
            "visibility": "public"
        }).sort("created_at", -1).skip(offset).limit(limit)

        user_cache: dict = {}

        async def get_user(uid: str):
            if uid not in user_cache:
                try:
                    u = await db.users.find_one({"_id": ObjectId(uid)})
                    user_cache[uid] = u
                except Exception:
                    user_cache[uid] = None
            return user_cache[uid]

        enriched = []
        async for card_doc in cursor:
            card_doc["id"] = str(card_doc["_id"])
            del card_doc["_id"]
            creator = await get_user(card_doc.get("user_id", ""))
            if creator:
                card_doc["created_by"] = {
                    "id": str(creator["_id"]),
                    "username": creator.get("username", "unknown"),
                    "full_name": creator.get("full_name"),
                    "profile_picture": creator.get("profile_picture"),
                }
                card_doc["author_username"] = creator.get("username")
                card_doc["author_full_name"] = creator.get("full_name")
                card_doc["author_profile_picture"] = creator.get("profile_picture")
            enriched.append(card_doc)

        return enriched
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

# ============== COMMENTS ==============

@router.get("/{card_id}/comments")
async def get_card_comments(
    card_id: str,
    current_user: User = Depends(get_current_user_dependency),
    db=Depends(get_database)
):
    """Get comments for a card"""
    try:
        raw = await db["card_comments"].find(
            {"card_id": card_id, "is_deleted": {"$ne": True}}
        ).sort("created_at", -1).to_list(length=100)

        comments = []
        for c in raw:
            comments.append({
                "id": str(c["_id"]),
                "user_id": str(c.get("user_id", "")),
                "username": c.get("username", "unknown"),
                "profile_picture": c.get("profile_picture"),
                "text": c.get("content", ""),
                "created_at": c["created_at"].isoformat() if hasattr(c.get("created_at"), "isoformat") else str(c.get("created_at", "")),
                "likes": c.get("likes", 0),
                "replies_count": 0,
                "liked_by_current_user": current_user.id in c.get("liked_by", []),
            })
        return comments

    except Exception as e:
        logger.error(f"Error getting card comments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get comments: {str(e)}"
        )


@router.post("/{card_id}/comments")
async def create_card_comment(
    card_id: str,
    text: dict,
    current_user: User = Depends(get_current_user_dependency),
    db=Depends(get_database)
):
    """Create a comment on a card"""
    try:
        from datetime import datetime

        comment_doc = {
            "card_id": card_id,
            "user_id": current_user.id,
            "username": current_user.username,
            "profile_picture": getattr(current_user, 'profile_picture', None),
            "content": text.get("text", ""),
            "created_at": datetime.utcnow(),
            "likes": 0,
            "liked_by": [],
            "is_deleted": False
        }

        result = await db["card_comments"].insert_one(comment_doc)

        # Create activity for commenting
        await create_activity(
            db=db,
            user_id=current_user.id,
            activity_type=ActivityType.COMMENT_POSTED,
            title=f"{current_user.username} commented on a card",
            description=f"commented: \"{text.get('text', '')[:50]}...\"",
            icon="💬",
            metadata={"card_id": card_id}
        )

        # Return comment with user info
        return {
            "id": str(result.inserted_id),
            "user_id": current_user.id,
            "username": current_user.username,
            "profile_picture": getattr(current_user, 'profile_picture', None),
            "text": text.get("text", ""),
            "created_at": datetime.utcnow().isoformat(),
            "likes": 0,
            "replies_count": 0,
            "liked_by_current_user": False
        }

    except Exception as e:
        logger.error(f"Error creating card comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create comment: {str(e)}"
        )


@router.post("/comments/{comment_id}/like")
async def like_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user_dependency),
    db=Depends(get_database)
):
    """Like or unlike a comment"""
    try:
        from bson import ObjectId

        comment = await db["card_comments"].find_one({"_id": ObjectId(comment_id)})
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        liked_by = comment.get("liked_by", [])
        is_liked = current_user.id in liked_by

        if is_liked:
            # Unlike
            await db["card_comments"].update_one(
                {"_id": ObjectId(comment_id)},
                {
                    "$pull": {"liked_by": current_user.id},
                    "$inc": {"likes": -1}
                }
            )
        else:
            # Like
            await db["card_comments"].update_one(
                {"_id": ObjectId(comment_id)},
                {
                    "$addToSet": {"liked_by": current_user.id},
                    "$inc": {"likes": 1}
                }
            )

        return {"success": True}

    except Exception as e:
        logger.error(f"Error liking comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to like comment: {str(e)}"
        )
