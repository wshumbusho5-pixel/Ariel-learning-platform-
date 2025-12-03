from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Achievement(BaseModel):
    """An achievement earned by a user"""
    id: str
    name: str
    description: str
    icon: str
    points: int
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None

class UserAchievement(BaseModel):
    """Track user's unlocked achievements"""
    id: Optional[str] = None
    user_id: str
    achievement_id: str
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)
    points_earned: int = 0

class LevelInfo(BaseModel):
    """User's level information"""
    current_level: int
    total_points: int
    points_to_next_level: int
    progress_percentage: float

class DailyGoal(BaseModel):
    """Daily goal progress"""
    cards_reviewed: int
    daily_goal: int
    percentage: float
    completed: bool

class Leaderboard(BaseModel):
    """Leaderboard entry"""
    rank: int
    user_id: str
    username: Optional[str]
    total_points: int
    level: int
    current_streak: int

class GamificationStats(BaseModel):
    """Complete gamification statistics"""
    level_info: LevelInfo
    achievements: List[Achievement]
    daily_goal: DailyGoal
    streak_bonus_today: int
