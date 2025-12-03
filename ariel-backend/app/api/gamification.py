from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.user import User
from app.models.gamification import Achievement, LevelInfo, GamificationStats, DailyGoal
from app.services.gamification_service import GamificationService
from app.services.progress_repository import ProgressRepository
from app.services.user_repository import UserRepository
from app.api.auth import get_current_user_dependency
from datetime import datetime

router = APIRouter()

@router.get("/level", response_model=LevelInfo)
async def get_level_info(
    current_user: User = Depends(get_current_user_dependency)
):
    """Get user's level information"""
    level_data = GamificationService.calculate_level(current_user.total_points)

    return LevelInfo(
        current_level=level_data["level"],
        total_points=current_user.total_points,
        points_to_next_level=level_data["points_to_next_level"],
        progress_percentage=level_data["progress_percentage"]
    )

@router.get("/achievements", response_model=List[Achievement])
async def get_achievements(
    current_user: User = Depends(get_current_user_dependency)
):
    """Get all achievements and their unlock status"""
    try:
        # Get user stats for achievement checking
        stats = await ProgressRepository.get_user_stats(current_user.id)

        user_data = {
            "total_reviews": stats.total_cards,  # Approximation
            "current_streak": stats.current_streak,
            "total_points": current_user.total_points,
            "cards_mastered": stats.cards_mastered,
            "retention_rate": stats.retention_rate
        }

        # Get unlocked achievement IDs
        unlocked_ids = GamificationService.check_achievements(user_data)

        # Get all achievement details
        all_achievements = GamificationService.get_achievement_details()

        # Build response
        achievements = []
        for achievement_id, details in all_achievements.items():
            achievements.append(Achievement(
                id=achievement_id,
                name=details["name"],
                description=details["description"],
                icon=details["icon"],
                points=details["points"],
                unlocked=achievement_id in unlocked_ids,
                unlocked_at=datetime.utcnow() if achievement_id in unlocked_ids else None
            ))

        return achievements
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/daily-goal", response_model=DailyGoal)
async def get_daily_goal(
    current_user: User = Depends(get_current_user_dependency)
):
    """Get daily goal progress"""
    try:
        stats = await ProgressRepository.get_user_stats(current_user.id)

        # For now, use cards_due_today as proxy for cards reviewed today
        # In production, you'd query today's daily_progress record
        goal_data = GamificationService.get_daily_goal_progress(
            cards_reviewed_today=stats.cards_due_today,
            goal=20
        )

        return DailyGoal(**goal_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=GamificationStats)
async def get_gamification_stats(
    current_user: User = Depends(get_current_user_dependency)
):
    """Get complete gamification statistics"""
    try:
        # Get level info
        level_data = GamificationService.calculate_level(current_user.total_points)
        level_info = LevelInfo(
            current_level=level_data["level"],
            total_points=current_user.total_points,
            points_to_next_level=level_data["points_to_next_level"],
            progress_percentage=level_data["progress_percentage"]
        )

        # Get achievements
        stats = await ProgressRepository.get_user_stats(current_user.id)
        user_data = {
            "total_reviews": stats.total_cards,
            "current_streak": stats.current_streak,
            "total_points": current_user.total_points,
            "cards_mastered": stats.cards_mastered,
            "retention_rate": stats.retention_rate
        }
        unlocked_ids = GamificationService.check_achievements(user_data)
        all_achievements_dict = GamificationService.get_achievement_details()

        achievements = []
        for achievement_id, details in all_achievements_dict.items():
            achievements.append(Achievement(
                id=achievement_id,
                name=details["name"],
                description=details["description"],
                icon=details["icon"],
                points=details["points"],
                unlocked=achievement_id in unlocked_ids,
                unlocked_at=datetime.utcnow() if achievement_id in unlocked_ids else None
            ))

        # Get daily goal
        goal_data = GamificationService.get_daily_goal_progress(
            cards_reviewed_today=stats.cards_due_today,
            goal=20
        )
        daily_goal = DailyGoal(**goal_data)

        # Calculate streak bonus
        streak_bonus = GamificationService.calculate_streak_bonus(current_user.current_streak)

        return GamificationStats(
            level_info=level_info,
            achievements=achievements,
            daily_goal=daily_goal,
            streak_bonus_today=streak_bonus
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
