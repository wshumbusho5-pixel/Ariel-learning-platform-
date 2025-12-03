from datetime import datetime, timedelta
from typing import Optional
from enum import Enum

class ReviewQuality(int, Enum):
    """
    Review quality based on SM-2 algorithm
    0 = Complete blackout
    1 = Incorrect, but remembered
    2 = Incorrect, but easy to recall
    3 = Correct, but difficult
    4 = Correct, with hesitation
    5 = Perfect recall
    """
    BLACKOUT = 0
    HARD_INCORRECT = 1
    EASY_INCORRECT = 2
    HARD_CORRECT = 3
    HESITANT_CORRECT = 4
    PERFECT = 5

class SpacedRepetitionService:
    """
    Implementation of SM-2 (SuperMemo 2) spaced repetition algorithm
    Enhanced for Ariel's positive learning approach
    """

    @staticmethod
    def calculate_next_review(
        quality: ReviewQuality,
        repetitions: int,
        easiness_factor: float,
        interval_days: int
    ) -> dict:
        """
        Calculate next review date based on SM-2 algorithm

        Returns:
            dict with: next_review_date, new_repetitions, new_easiness_factor, new_interval
        """

        # Update easiness factor (EF)
        # EF' = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        new_ef = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

        # Ensure EF stays within bounds (1.3 minimum)
        new_ef = max(1.3, new_ef)

        # Calculate new interval and repetitions
        if quality < 3:  # Incorrect response
            # Reset repetitions, review again soon
            new_repetitions = 0
            new_interval = 1
        else:  # Correct response
            new_repetitions = repetitions + 1

            if new_repetitions == 1:
                new_interval = 1
            elif new_repetitions == 2:
                new_interval = 6
            else:
                new_interval = round(interval_days * new_ef)

        # Calculate next review date
        next_review = datetime.utcnow() + timedelta(days=new_interval)

        return {
            "next_review_date": next_review,
            "repetitions": new_repetitions,
            "easiness_factor": round(new_ef, 2),
            "interval_days": new_interval
        }

    @staticmethod
    def get_initial_values() -> dict:
        """Get initial values for a new card"""
        return {
            "repetitions": 0,
            "easiness_factor": 2.5,
            "interval_days": 0,
            "next_review_date": datetime.utcnow()
        }

    @staticmethod
    def is_due_for_review(next_review_date: datetime) -> bool:
        """Check if a question is due for review"""
        return datetime.utcnow() >= next_review_date

    @staticmethod
    def get_study_load_distribution(total_cards: int, days: int = 30) -> list:
        """
        Estimate study load distribution for planning
        Helps students see future workload
        """
        # This is a simplified projection
        # In reality, this would be based on actual card data
        daily_new = max(1, total_cards // days)
        daily_reviews = []

        cumulative_cards = 0
        for day in range(days):
            cumulative_cards += daily_new
            reviews_due = min(cumulative_cards, int(cumulative_cards * 0.3))  # ~30% review rate
            daily_reviews.append({
                "day": day + 1,
                "new_cards": daily_new if day < days else 0,
                "reviews": reviews_due
            })

        return daily_reviews

    @staticmethod
    def calculate_retention_rate(correct: int, total: int) -> float:
        """Calculate retention rate percentage"""
        if total == 0:
            return 0.0
        return round((correct / total) * 100, 1)
