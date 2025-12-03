from typing import Dict, List
from datetime import datetime, timedelta

class GamificationService:
    """
    Gamification system for Ariel
    Points, levels, streaks, and achievements
    """

    # Points system
    POINTS_PER_REVIEW = 10
    POINTS_PERFECT_RECALL = 20
    POINTS_STREAK_BONUS = 5  # Per day in streak
    POINTS_NEW_CARD = 15

    # Level system (XP needed for each level)
    LEVEL_THRESHOLDS = [
        0,      # Level 1
        100,    # Level 2
        250,    # Level 3
        500,    # Level 4
        1000,   # Level 5
        2000,   # Level 6
        4000,   # Level 7
        8000,   # Level 8
        16000,  # Level 9
        32000,  # Level 10
    ]

    @staticmethod
    def calculate_points_for_review(quality: int, is_perfect: bool = False) -> int:
        """Calculate points earned for a review"""
        base_points = GamificationService.POINTS_PER_REVIEW

        if is_perfect or quality == 5:
            return GamificationService.POINTS_PERFECT_RECALL

        return base_points

    @staticmethod
    def calculate_level(total_points: int) -> Dict:
        """
        Calculate user level based on total points

        Returns:
            dict with: level, points_to_next_level, progress_percentage
        """
        level = 1
        for i, threshold in enumerate(GamificationService.LEVEL_THRESHOLDS):
            if total_points >= threshold:
                level = i + 1
            else:
                break

        # Calculate progress to next level
        if level < len(GamificationService.LEVEL_THRESHOLDS):
            current_threshold = GamificationService.LEVEL_THRESHOLDS[level - 1]
            next_threshold = GamificationService.LEVEL_THRESHOLDS[level]
            points_in_level = total_points - current_threshold
            points_needed = next_threshold - current_threshold
            progress_percentage = round((points_in_level / points_needed) * 100, 1)
            points_to_next = next_threshold - total_points
        else:
            # Max level reached
            progress_percentage = 100.0
            points_to_next = 0

        return {
            "level": level,
            "points_to_next_level": points_to_next,
            "progress_percentage": progress_percentage
        }

    @staticmethod
    def calculate_streak_bonus(streak_days: int) -> int:
        """Calculate bonus points for maintaining a streak"""
        if streak_days <= 1:
            return 0

        return streak_days * GamificationService.POINTS_STREAK_BONUS

    @staticmethod
    def check_achievements(user_data: Dict) -> List[str]:
        """
        Check which achievements user has unlocked

        Returns list of achievement IDs
        """
        achievements = []

        total_reviews = user_data.get("total_reviews", 0)
        streak = user_data.get("current_streak", 0)
        total_points = user_data.get("total_points", 0)
        cards_mastered = user_data.get("cards_mastered", 0)
        retention_rate = user_data.get("retention_rate", 0)

        # Review milestones
        if total_reviews >= 10:
            achievements.append("first_10_reviews")
        if total_reviews >= 100:
            achievements.append("century_club")
        if total_reviews >= 1000:
            achievements.append("master_reviewer")

        # Streak achievements
        if streak >= 7:
            achievements.append("week_warrior")
        if streak >= 30:
            achievements.append("month_master")
        if streak >= 100:
            achievements.append("unstoppable")

        # Mastery achievements
        if cards_mastered >= 50:
            achievements.append("knowledge_collector")
        if cards_mastered >= 200:
            achievements.append("scholar")
        if cards_mastered >= 1000:
            achievements.append("sage")

        # Accuracy achievements
        if retention_rate >= 80 and total_reviews >= 50:
            achievements.append("accuracy_ace")
        if retention_rate >= 90 and total_reviews >= 100:
            achievements.append("perfect_recall")

        # Points milestones
        if total_points >= 1000:
            achievements.append("points_pioneer")
        if total_points >= 10000:
            achievements.append("points_legend")

        return achievements

    @staticmethod
    def get_achievement_details() -> Dict[str, Dict]:
        """Get details for all achievements"""
        return {
            # Review milestones
            "first_10_reviews": {
                "name": "Getting Started",
                "description": "Complete 10 reviews",
                "icon": "🌱",
                "points": 50
            },
            "century_club": {
                "name": "Century Club",
                "description": "Complete 100 reviews",
                "icon": "💯",
                "points": 500
            },
            "master_reviewer": {
                "name": "Master Reviewer",
                "description": "Complete 1000 reviews",
                "icon": "👑",
                "points": 5000
            },

            # Streak achievements
            "week_warrior": {
                "name": "Week Warrior",
                "description": "Maintain a 7-day streak",
                "icon": "🔥",
                "points": 100
            },
            "month_master": {
                "name": "Month Master",
                "description": "Maintain a 30-day streak",
                "icon": "⚡",
                "points": 1000
            },
            "unstoppable": {
                "name": "Unstoppable",
                "description": "Maintain a 100-day streak",
                "icon": "🚀",
                "points": 10000
            },

            # Mastery achievements
            "knowledge_collector": {
                "name": "Knowledge Collector",
                "description": "Master 50 cards",
                "icon": "📚",
                "points": 200
            },
            "scholar": {
                "name": "Scholar",
                "description": "Master 200 cards",
                "icon": "🎓",
                "points": 1000
            },
            "sage": {
                "name": "Sage",
                "description": "Master 1000 cards",
                "icon": "🧙",
                "points": 10000
            },

            # Accuracy achievements
            "accuracy_ace": {
                "name": "Accuracy Ace",
                "description": "Maintain 80% retention rate",
                "icon": "🎯",
                "points": 300
            },
            "perfect_recall": {
                "name": "Perfect Recall",
                "description": "Maintain 90% retention rate",
                "icon": "💎",
                "points": 1000
            },

            # Points milestones
            "points_pioneer": {
                "name": "Points Pioneer",
                "description": "Earn 1000 points",
                "icon": "⭐",
                "points": 0
            },
            "points_legend": {
                "name": "Points Legend",
                "description": "Earn 10000 points",
                "icon": "🏆",
                "points": 0
            },
        }

    @staticmethod
    def get_daily_goal_progress(cards_reviewed_today: int, goal: int = 20) -> Dict:
        """Calculate daily goal progress"""
        percentage = min(100, round((cards_reviewed_today / goal) * 100, 1))

        return {
            "cards_reviewed": cards_reviewed_today,
            "daily_goal": goal,
            "percentage": percentage,
            "completed": cards_reviewed_today >= goal
        }
