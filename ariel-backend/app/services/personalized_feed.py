from typing import List, Dict, Optional
from app.models.user import User
from app.models.card import Card
from app.services.card_repository import CardRepository
from app.services.database_service import db_service
import random
from datetime import datetime, timedelta


class PersonalizedFeedService:
    """
    Generates personalized feed of cards.

    Feed Mix:
    - 40% From people you follow (newest first)
    - 25% Cards from your enrolled subjects
    - 20% Trending / recent public cards
    - 10% Discovery (new topics)
    - 5%  Your own due-for-review cards
    """

    @staticmethod
    async def get_personalized_feed(
        user: User,
        limit: int = 50,
        offset: int = 0
    ) -> List[Card]:

        feed_cards = []
        seen_ids = set()

        def add_cards(cards: List[Card]):
            for card in cards:
                if card.id not in seen_ids:
                    seen_ids.add(card.id)
                    feed_cards.append(card)

        # 1. Cards from people you follow (40%) — most important, shown first
        if user.following:
            following_cards = await PersonalizedFeedService._get_following_cards(
                user, int(limit * 0.40)
            )
            add_cards(following_cards)

        # 2. Cards from enrolled subjects (25%)
        if user.subjects:
            subject_cards = await PersonalizedFeedService._get_subject_cards(
                user, int(limit * 0.25)
            )
            add_cards(subject_cards)

        # 3. Recent trending public cards (20%)
        trending = await PersonalizedFeedService._get_recent_trending(int(limit * 0.20))
        add_cards(trending)

        # 4. Discovery — topics outside your subjects (10%)
        discover = await PersonalizedFeedService._get_discover_cards(user, int(limit * 0.10))
        add_cards(discover)

        # 5. Your own due cards (5%)
        review_cards = await CardRepository.get_due_cards(user.id, int(limit * 0.05))
        add_cards(review_cards)

        # If feed is still sparse, fill with recent public cards
        if len(feed_cards) < limit // 2:
            fill = await PersonalizedFeedService._get_recent_trending(limit * 2)
            add_cards(fill)

        # Soft shuffle — don't fully randomize so following cards stay near top
        following_section = feed_cards[:int(limit * 0.40)]
        rest = feed_cards[int(limit * 0.40):]
        random.shuffle(rest)
        combined = following_section + rest

        return combined[offset:offset + limit]

    @staticmethod
    async def _get_following_cards(user: User, limit: int) -> List[Card]:
        """Get recent public cards from people the user follows."""
        if not user.following:
            return []

        db = db_service.get_db()
        cards = []

        cursor = db["cards"].find({
            "user_id": {"$in": user.following},
            "visibility": "public"
        }).sort("created_at", -1).limit(limit * 2)

        async for card_doc in cursor:
            card_doc["id"] = str(card_doc["_id"])
            del card_doc["_id"]
            try:
                cards.append(Card(**card_doc))
            except Exception:
                pass

        return cards[:limit]

    @staticmethod
    async def _get_recent_trending(limit: int) -> List[Card]:
        """
        Get trending public cards with a recency boost.
        New cards (< 7 days) are included even with 0 likes.
        """
        db = db_service.get_db()
        cards = []

        # Recent cards (last 7 days) — show regardless of likes
        week_ago = datetime.utcnow() - timedelta(days=7)
        cursor = db["cards"].find({
            "visibility": "public",
            "created_at": {"$gte": week_ago}
        }).sort("created_at", -1).limit(limit * 2)

        async for card_doc in cursor:
            card_doc["id"] = str(card_doc["_id"])
            del card_doc["_id"]
            try:
                cards.append(Card(**card_doc))
            except Exception:
                pass

        # If not enough recent cards, top up with all-time popular
        if len(cards) < limit:
            older = await CardRepository.get_trending_cards(limit * 2)
            seen = {c.id for c in cards}
            for c in older:
                if c.id not in seen:
                    cards.append(c)

        return cards[:limit]

    @staticmethod
    async def _get_subject_cards(user: User, limit: int) -> List[Card]:
        """Get recent public cards matching user's enrolled subjects."""
        if not user.subjects:
            return []

        db = db_service.get_db()
        subject_list = [s.lower() for s in user.subjects]
        cards = []

        cursor = db["cards"].find({
            "visibility": "public",
            "subject": {"$regex": "|".join(subject_list), "$options": "i"}
        }).sort("created_at", -1).limit(limit * 3)

        async for card_doc in cursor:
            card_doc["id"] = str(card_doc["_id"])
            del card_doc["_id"]
            try:
                cards.append(Card(**card_doc))
            except Exception:
                pass

        return cards[:limit]

    @staticmethod
    async def _get_discover_cards(user: User, limit: int) -> List[Card]:
        """Get public cards from topics outside the user's normal subjects."""
        db = db_service.get_db()
        user_subjects = [s.lower() for s in (user.subjects or [])]
        cards = []

        query = {"visibility": "public"}
        if user_subjects:
            # Exclude cards that match the user's enrolled subjects
            query["subject"] = {"$not": {"$regex": "|".join(user_subjects), "$options": "i"}}

        cursor = db["cards"].find(query).sort("created_at", -1).limit(limit * 3)

        async for card_doc in cursor:
            card_doc["id"] = str(card_doc["_id"])
            del card_doc["_id"]
            try:
                cards.append(Card(**card_doc))
            except Exception:
                pass

        return cards[:limit]

    @staticmethod
    async def get_feed_insights(user: User) -> Dict:
        feed = await PersonalizedFeedService.get_personalized_feed(user, limit=50)

        subjects_count: Dict[str, int] = {}
        topics_count: Dict[str, int] = {}

        for card in feed:
            if card.subject:
                subjects_count[card.subject] = subjects_count.get(card.subject, 0) + 1
            if card.topic:
                topics_count[card.topic] = topics_count.get(card.topic, 0) + 1

        return {
            "total_cards": len(feed),
            "subjects": subjects_count,
            "topics": topics_count,
            "enrolled_subjects": user.subjects or [],
            "following_count": len(user.following or []),
            "feed_quality": "personalized" if (user.subjects or user.following) else "general"
        }


# Global instance
personalized_feed_service = PersonalizedFeedService()
