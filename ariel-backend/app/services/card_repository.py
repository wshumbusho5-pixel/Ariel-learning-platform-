from typing import Optional, List
from app.models.card import Card, CardCreate, CardUpdate, DeckStats
from app.services.database_service import db_service
from app.services.spaced_repetition import SpacedRepetitionService
from bson import ObjectId
from datetime import datetime, timedelta

class CardRepository:
    collection_name = "cards"

    @staticmethod
    async def create_card(card_data: CardCreate, user_id: str) -> Card:
        """Create a new flashcard"""
        db = db_service.get_db()

        # Calculate initial next_review (immediate for new cards)
        next_review = datetime.utcnow()

        card_dict = {
            "user_id": user_id,
            "question": card_data.question,
            "answer": card_data.answer,
            "explanation": card_data.explanation,
            "subject": card_data.subject,
            "topic": card_data.topic,
            "tags": card_data.tags,
            "visibility": card_data.visibility,
            "class_id": card_data.class_id,
            "likes": 0,
            "saves": 0,
            "review_count": 0,
            "ease_factor": 2.5,
            "interval": 0,
            "next_review": next_review,
            "last_review": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await db[CardRepository.collection_name].insert_one(card_dict)
        card_dict["id"] = str(result.inserted_id)
        del card_dict["_id"]

        return Card(**card_dict)

    @staticmethod
    async def create_cards_bulk(cards_data: List[CardCreate], user_id: str) -> List[Card]:
        """Create multiple cards at once"""
        db = db_service.get_db()

        cards_to_insert = []
        for card_data in cards_data:
            card_dict = {
                "user_id": user_id,
                "question": card_data.question,
                "answer": card_data.answer,
                "explanation": card_data.explanation,
                "subject": card_data.subject,
                "topic": card_data.topic,
                "tags": card_data.tags,
                "visibility": card_data.visibility,
                "class_id": card_data.class_id,
                "likes": 0,
                "saves": 0,
                "review_count": 0,
                "ease_factor": 2.5,
                "interval": 0,
                "next_review": datetime.utcnow(),
                "last_review": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            cards_to_insert.append(card_dict)

        result = await db[CardRepository.collection_name].insert_many(cards_to_insert)

        # Fetch and return created cards
        cards = []
        for inserted_id, card_dict in zip(result.inserted_ids, cards_to_insert):
            card_dict["id"] = str(inserted_id)
            cards.append(Card(**card_dict))

        return cards

    @staticmethod
    async def get_card(card_id: str, user_id: str) -> Optional[Card]:
        """Get a card by ID (must be owned by user or public)"""
        db = db_service.get_db()

        card_doc = await db[CardRepository.collection_name].find_one({
            "_id": ObjectId(card_id),
            "$or": [
                {"user_id": user_id},
                {"visibility": "public"}
            ]
        })

        if card_doc:
            card_doc["id"] = str(card_doc["_id"])
            del card_doc["_id"]
            return Card(**card_doc)
        return None

    @staticmethod
    async def get_user_cards(
        user_id: str,
        subject: Optional[str] = None,
        topic: Optional[str] = None,
        tags: Optional[List[str]] = None,
        limit: int = 500,
        skip: int = 0
    ) -> List[Card]:
        """Get user's personal cards with filters"""
        db = db_service.get_db()

        query = {"user_id": user_id}

        if subject:
            query["subject"] = subject
        if topic:
            query["topic"] = topic
        if tags:
            query["tags"] = {"$in": tags}

        # Sort newest first so newly created cards always appear at the top
        cursor = db[CardRepository.collection_name].find(query).sort("created_at", -1).skip(skip).limit(limit)

        cards = []
        async for card_doc in cursor:
            card_doc["id"] = str(card_doc["_id"])
            del card_doc["_id"]
            cards.append(Card(**card_doc))

        return cards

    @staticmethod
    async def get_due_cards(user_id: str, limit: int = 20) -> List[Card]:
        """Get cards due for review (spaced repetition)"""
        db = db_service.get_db()

        now = datetime.utcnow()

        cursor = db[CardRepository.collection_name].find({
            "user_id": user_id,
            "$or": [
                {"next_review": {"$lte": now}},
                {"next_review": {"$exists": False}},
                {"review_count": {"$exists": False}},
                {"review_count": 0},
            ]
        }).limit(limit)

        cards = []
        async for card_doc in cursor:
            card_doc["id"] = str(card_doc["_id"])
            del card_doc["_id"]
            cards.append(Card(**card_doc))

        return cards

    @staticmethod
    async def get_trending_cards(limit: int = 50) -> List[Card]:
        """Get trending public cards (most liked/saved)"""
        db = db_service.get_db()

        cursor = db[CardRepository.collection_name].find({
            "visibility": "public"
        }).sort([("likes", -1), ("saves", -1)]).limit(limit)

        cards = []
        async for card_doc in cursor:
            card_doc["id"] = str(card_doc["_id"])
            del card_doc["_id"]
            # Seed/system cards may have no user_id
            card_doc.setdefault("user_id", card_doc.get("created_by") or "system")
            try:
                cards.append(Card(**card_doc))
            except Exception:
                pass

        return cards

    @staticmethod
    async def update_card(card_id: str, user_id: str, update_data: CardUpdate) -> Optional[Card]:
        """Update a card (must be owned by user)"""
        db = db_service.get_db()

        update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()

        result = await db[CardRepository.collection_name].update_one(
            {"_id": ObjectId(card_id), "user_id": user_id},
            {"$set": update_dict}
        )

        if result.modified_count > 0:
            return await CardRepository.get_card(card_id, user_id)
        return None

    @staticmethod
    async def review_card(card_id: str, user_id: str, quality: int) -> Optional[Card]:
        """
        Update card after review using spaced repetition algorithm
        quality: 0-5 (0=total blackout, 5=perfect response)
        """
        db = db_service.get_db()

        card = await CardRepository.get_card(card_id, user_id)
        if not card:
            return None

        # Calculate new spaced repetition values
        sr_data = SpacedRepetitionService.calculate_next_review(
            quality=quality,
            repetitions=card.review_count,
            easiness_factor=card.ease_factor,
            interval_days=card.interval
        )

        # Update card
        update_dict = {
            "review_count": sr_data["repetitions"],
            "ease_factor": sr_data["easiness_factor"],
            "interval": sr_data["interval_days"],
            "next_review": sr_data["next_review_date"],
            "last_review": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        await db[CardRepository.collection_name].update_one(
            {"_id": ObjectId(card_id)},
            {"$set": update_dict}
        )

        # Log community review event
        try:
            await db["card_reviews"].insert_one({
                "card_id": card_id,
                "user_id": user_id,
                "quality": quality,
                "reviewed_at": datetime.utcnow()
            })
        except Exception:
            pass

        return await CardRepository.get_card(card_id, user_id)

    @staticmethod
    async def like_card(card_id: str, user_id: str) -> dict:
        """Toggle like on a card. Returns {liked: bool, likes: int}"""
        db = db_service.get_db()
        card = await db[CardRepository.collection_name].find_one({"_id": ObjectId(card_id)})
        if not card:
            return {"liked": False, "likes": 0}

        liked_by = card.get("liked_by", [])
        already_liked = user_id in liked_by

        if already_liked:
            await db[CardRepository.collection_name].update_one(
                {"_id": ObjectId(card_id)},
                {"$pull": {"liked_by": user_id}, "$inc": {"likes": -1}}
            )
            new_count = max(0, card.get("likes", 0) - 1)
        else:
            await db[CardRepository.collection_name].update_one(
                {"_id": ObjectId(card_id)},
                {"$addToSet": {"liked_by": user_id}, "$inc": {"likes": 1}}
            )
            new_count = card.get("likes", 0) + 1

        return {"liked": not already_liked, "likes": new_count}

    @staticmethod
    async def save_card(card_id: str, user_id: str) -> Optional[Card]:
        """Save someone else's card to your deck (copy it)"""
        db = db_service.get_db()

        # Get the original card
        original_card = await db[CardRepository.collection_name].find_one({"_id": ObjectId(card_id)})
        if not original_card or original_card.get("visibility", "public") == "private":
            return None

        # Create a copy for the user
        card_copy = {
            "user_id": user_id,
            "question": original_card["question"],
            "answer": original_card["answer"],
            "explanation": original_card.get("explanation"),
            "subject": original_card.get("subject"),
            "topic": original_card.get("topic"),
            "tags": original_card.get("tags", []),
            "visibility": "private",  # Saved cards are private by default
            "class_id": None,
            "likes": 0,
            "saves": 0,
            "review_count": 0,
            "ease_factor": 2.5,
            "interval": 0,
            "next_review": datetime.utcnow(),
            "last_review": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await db[CardRepository.collection_name].insert_one(card_copy)

        # Increment save count on original
        await db[CardRepository.collection_name].update_one(
            {"_id": ObjectId(card_id)},
            {"$inc": {"saves": 1}}
        )

        card_copy["id"] = str(result.inserted_id)
        del card_copy["_id"]
        return Card(**card_copy)

    @staticmethod
    async def delete_card(card_id: str, user_id: str) -> bool:
        """Delete a card (must be owned by user)"""
        db = db_service.get_db()

        result = await db[CardRepository.collection_name].delete_one({
            "_id": ObjectId(card_id),
            "user_id": user_id
        })

        return result.deleted_count > 0

    @staticmethod
    async def get_deck_stats(user_id: str) -> DeckStats:
        """Get statistics about user's deck"""
        db = db_service.get_db()

        now = datetime.utcnow()

        # Total cards
        total = await db[CardRepository.collection_name].count_documents({"user_id": user_id})

        # New cards (never reviewed)
        new_cards = await db[CardRepository.collection_name].count_documents({
            "user_id": user_id,
            "review_count": 0
        })

        # Due today
        due = await db[CardRepository.collection_name].count_documents({
            "user_id": user_id,
            "next_review": {"$lte": now}
        })

        # Mastered (reviewed 5+ times with high ease factor)
        mastered = await db[CardRepository.collection_name].count_documents({
            "user_id": user_id,
            "review_count": {"$gte": 5},
            "ease_factor": {"$gte": 2.5}
        })

        # By subject
        subject_pipeline = [
            {"$match": {"user_id": user_id, "subject": {"$ne": None}}},
            {"$group": {"_id": "$subject", "count": {"$sum": 1}}}
        ]
        by_subject = {}
        async for doc in db[CardRepository.collection_name].aggregate(subject_pipeline):
            by_subject[doc["_id"]] = doc["count"]

        # By topic
        topic_pipeline = [
            {"$match": {"user_id": user_id, "topic": {"$ne": None}}},
            {"$group": {"_id": "$topic", "count": {"$sum": 1}}}
        ]
        by_topic = {}
        async for doc in db[CardRepository.collection_name].aggregate(topic_pipeline):
            by_topic[doc["_id"]] = doc["count"]

        return DeckStats(
            total_cards=total,
            new_cards=new_cards,
            due_today=due,
            mastered=mastered,
            by_subject=by_subject,
            by_topic=by_topic
        )
