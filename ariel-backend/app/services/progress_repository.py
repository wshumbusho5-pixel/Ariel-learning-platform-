from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from app.models.progress import ReviewCard, ReviewSubmission, ReviewSession, DailyProgress, StudyStats
from app.services.database_service import db_service
from app.services.spaced_repetition import SpacedRepetitionService

class ProgressRepository:
    cards_collection = "review_cards"
    sessions_collection = "review_sessions"
    daily_progress_collection = "daily_progress"

    @staticmethod
    async def create_card(user_id: str, question_id: str, question_text: str, correct_answer: str) -> ReviewCard:
        """Create a new review card"""
        db = db_service.get_db()

        # Check if card already exists
        existing = await db[ProgressRepository.cards_collection].find_one({
            "user_id": user_id,
            "question_id": question_id
        })

        if existing:
            existing["id"] = str(existing["_id"])
            del existing["_id"]
            return ReviewCard(**existing)

        # Create new card with initial SR values
        initial_values = SpacedRepetitionService.get_initial_values()
        card_dict = {
            "user_id": user_id,
            "question_id": question_id,
            "question_text": question_text,
            "correct_answer": correct_answer,
            "repetitions": initial_values["repetitions"],
            "easiness_factor": initial_values["easiness_factor"],
            "interval_days": initial_values["interval_days"],
            "next_review_date": initial_values["next_review_date"],
            "total_reviews": 0,
            "correct_reviews": 0,
            "last_review_date": None,
            "last_review_quality": None,
            "created_at": datetime.utcnow(),
            "is_active": True
        }

        result = await db[ProgressRepository.cards_collection].insert_one(card_dict)
        card_dict["id"] = str(result.inserted_id)
        del card_dict["_id"]

        return ReviewCard(**card_dict)

    @staticmethod
    async def submit_review(user_id: str, submission: ReviewSubmission) -> ReviewCard:
        """Submit a review and update card using spaced repetition"""
        db = db_service.get_db()

        # Get the card
        card_doc = await db[ProgressRepository.cards_collection].find_one({
            "_id": ObjectId(submission.card_id),
            "user_id": user_id
        })

        if not card_doc:
            raise ValueError("Card not found")

        card = ReviewCard(**{**card_doc, "id": str(card_doc["_id"])})

        # Calculate next review using SR algorithm
        sr_result = SpacedRepetitionService.calculate_next_review(
            quality=submission.quality,
            repetitions=card.repetitions,
            easiness_factor=card.easiness_factor,
            interval_days=card.interval_days
        )

        # Update card
        is_correct = submission.quality >= 3
        update_data = {
            "repetitions": sr_result["repetitions"],
            "easiness_factor": sr_result["easiness_factor"],
            "interval_days": sr_result["interval_days"],
            "next_review_date": sr_result["next_review_date"],
            "total_reviews": card.total_reviews + 1,
            "correct_reviews": card.correct_reviews + (1 if is_correct else 0),
            "last_review_date": datetime.utcnow(),
            "last_review_quality": submission.quality
        }

        await db[ProgressRepository.cards_collection].update_one(
            {"_id": ObjectId(submission.card_id)},
            {"$set": update_data}
        )

        # Update daily progress
        await ProgressRepository._update_daily_progress(user_id, is_correct, submission.time_spent_seconds)

        # Return updated card
        updated_card = await db[ProgressRepository.cards_collection].find_one(
            {"_id": ObjectId(submission.card_id)}
        )
        updated_card["id"] = str(updated_card["_id"])
        del updated_card["_id"]

        return ReviewCard(**updated_card)

    @staticmethod
    async def get_due_cards(user_id: str, limit: int = 20) -> List[ReviewCard]:
        """Get cards due for review"""
        db = db_service.get_db()

        cursor = db[ProgressRepository.cards_collection].find({
            "user_id": user_id,
            "is_active": True,
            "next_review_date": {"$lte": datetime.utcnow()}
        }).sort("next_review_date", 1).limit(limit)

        cards = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            cards.append(ReviewCard(**doc))

        return cards

    @staticmethod
    async def get_user_stats(user_id: str) -> StudyStats:
        """Get user's study statistics"""
        db = db_service.get_db()

        # Get all user's cards
        cursor = db[ProgressRepository.cards_collection].find({"user_id": user_id, "is_active": True})
        cards = await cursor.to_list(length=None)

        total_cards = len(cards)
        cards_due = sum(1 for c in cards if SpacedRepetitionService.is_due_for_review(c["next_review_date"]))
        cards_mastered = sum(1 for c in cards if c["repetitions"] >= 5)

        # Calculate retention rate
        total_reviews = sum(c["total_reviews"] for c in cards)
        correct_reviews = sum(c["correct_reviews"] for c in cards)
        retention_rate = SpacedRepetitionService.calculate_retention_rate(correct_reviews, total_reviews)

        # Get daily progress for streak calculation
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        streak = await ProgressRepository._calculate_streak(user_id, today)

        # Cards by difficulty (based on easiness factor)
        cards_by_difficulty = {
            "hard": sum(1 for c in cards if c["easiness_factor"] < 2.0),
            "medium": sum(1 for c in cards if 2.0 <= c["easiness_factor"] < 2.5),
            "easy": sum(1 for c in cards if c["easiness_factor"] >= 2.5)
        }

        # Total study time (from daily progress)
        daily_cursor = db[ProgressRepository.daily_progress_collection].find({"user_id": user_id})
        daily_records = await daily_cursor.to_list(length=None)
        total_time_seconds = sum(d.get("time_studied_seconds", 0) for d in daily_records)

        return StudyStats(
            total_cards=total_cards,
            cards_due_today=cards_due,
            cards_mastered=cards_mastered,
            retention_rate=retention_rate,
            current_streak=streak["current"],
            longest_streak=streak["longest"],
            total_study_time_hours=round(total_time_seconds / 3600, 1),
            cards_by_difficulty=cards_by_difficulty
        )

    @staticmethod
    async def _update_daily_progress(user_id: str, is_correct: bool, time_spent: Optional[int]):
        """Update daily progress"""
        db = db_service.get_db()
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # Update or create today's progress
        await db[ProgressRepository.daily_progress_collection].update_one(
            {"user_id": user_id, "date": today},
            {
                "$inc": {
                    "cards_reviewed": 1,
                    "cards_correct": 1 if is_correct else 0,
                    "time_studied_seconds": time_spent or 0
                },
                "$setOnInsert": {
                    "new_cards_learned": 0,
                    "streak_day": 0
                }
            },
            upsert=True
        )

    @staticmethod
    async def _calculate_streak(user_id: str, today: datetime) -> dict:
        """Calculate current and longest streak"""
        db = db_service.get_db()

        # Get all daily progress sorted by date descending
        cursor = db[ProgressRepository.daily_progress_collection].find(
            {"user_id": user_id}
        ).sort("date", -1)

        records = await cursor.to_list(length=None)

        current_streak = 0
        longest_streak = 0
        temp_streak = 0

        for i, record in enumerate(records):
            if i == 0:
                # Check today
                if record["date"] >= today:
                    current_streak = 1
                    temp_streak = 1
                else:
                    break
            else:
                # Check if consecutive day
                expected_date = records[i-1]["date"] - timedelta(days=1)
                if record["date"].date() == expected_date.date():
                    temp_streak += 1
                    if i < len(records) and records[i-1]["date"] >= today:
                        current_streak = temp_streak
                else:
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 1

        longest_streak = max(longest_streak, temp_streak, current_streak)

        return {"current": current_streak, "longest": longest_streak}
