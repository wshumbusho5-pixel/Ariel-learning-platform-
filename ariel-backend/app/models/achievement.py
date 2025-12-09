"""
Achievement & Streak Models - Gamification system
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


class AchievementCategory(str, Enum):
    STREAK = "streak"  # Study streak achievements
    CARDS = "cards"  # Card review achievements
    SOCIAL = "social"  # Social achievements (followers, likes)
    LEARNING = "learning"  # Learning milestones
    SPECIAL = "special"  # Seasonal/special events


class AchievementRarity(str, Enum):
    COMMON = "common"  # Easy to get
    RARE = "rare"  # Moderate difficulty
    EPIC = "epic"  # Challenging
    LEGENDARY = "legendary"  # Very rare


class AchievementDefinition(BaseModel):
    """
    Master list of all possible achievements
    """
    id: str  # Unique achievement ID (e.g., "streak_7_days")
    title: str  # Display name
    description: str  # What user needs to do
    icon: str  # Emoji or icon name
    category: AchievementCategory
    rarity: AchievementRarity

    # Unlock criteria
    requirement_type: str  # "streak_days", "cards_reviewed", "followers_count", etc.
    requirement_value: int  # Target number

    # Rewards
    points_reward: int  # Points earned when unlocked
    share_to_story_template: Optional[str] = None  # Pre-filled story text

    # Metadata
    is_hidden: bool = False  # Hidden until unlocked (surprise achievements)
    is_repeatable: bool = False  # Can be earned multiple times


class UserAchievement(BaseModel):
    """
    User's unlocked achievements
    """
    id: Optional[str] = None
    user_id: str
    achievement_id: str  # Links to AchievementDefinition

    # Unlock details
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)
    progress_at_unlock: int  # Value when unlocked (e.g., 7 for 7-day streak)

    # Social
    shared_to_story: bool = False
    shared_at: Optional[datetime] = None

    # Display
    is_pinned: bool = False  # Pin to profile
    display_order: int = 0  # Order on profile


class StreakData(BaseModel):
    """
    User's streak tracking
    """
    id: Optional[str] = None
    user_id: str

    # Current streak
    current_streak: int = 0
    last_activity_date: Optional[date] = None

    # Historical data
    longest_streak: int = 0
    total_active_days: int = 0

    # Freeze cards (protect streak)
    freeze_cards_available: int = 3  # Free streak freezes
    freeze_cards_used: int = 0

    # Metadata
    streak_start_date: Optional[date] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DailyActivity(BaseModel):
    """
    Track daily activity for streak calculation
    """
    id: Optional[str] = None
    user_id: str
    activity_date: date = Field(default_factory=date.today)

    # Activity counts
    cards_reviewed: int = 0
    time_spent_minutes: int = 0
    decks_created: int = 0
    stories_posted: int = 0

    # Goals
    daily_goal_met: bool = False
    daily_goal_target: int = 20  # Default: 20 cards per day

    created_at: datetime = Field(default_factory=datetime.utcnow)


class AchievementProgress(BaseModel):
    """
    Track progress toward achievements
    """
    achievement_id: str
    title: str
    description: str
    icon: str
    category: AchievementCategory
    rarity: AchievementRarity

    # Progress
    current_value: int  # Current progress
    target_value: int  # Required to unlock
    percentage: int  # 0-100

    # Status
    is_unlocked: bool
    unlocked_at: Optional[datetime] = None

    # Rewards
    points_reward: int


class LeaderboardEntry(BaseModel):
    """
    User entry in leaderboard
    """
    rank: int
    user_id: str
    username: Optional[str]
    full_name: Optional[str]
    profile_picture: Optional[str]
    is_verified: bool

    # Stats
    current_streak: int
    total_points: int
    achievements_count: int

    # Context
    is_current_user: bool = False


# Pre-defined achievements
ACHIEVEMENT_DEFINITIONS = [
    # === STREAK ACHIEVEMENTS ===
    AchievementDefinition(
        id="streak_3_days",
        title="Getting Started",
        description="Study for 3 days in a row",
        icon="🔥",
        category=AchievementCategory.STREAK,
        rarity=AchievementRarity.COMMON,
        requirement_type="streak_days",
        requirement_value=3,
        points_reward=50,
        share_to_story_template="3-day streak! Just getting started! 🔥"
    ),
    AchievementDefinition(
        id="streak_7_days",
        title="Week Warrior",
        description="Study for 7 days straight",
        icon="⚡",
        category=AchievementCategory.STREAK,
        rarity=AchievementRarity.RARE,
        requirement_type="streak_days",
        requirement_value=7,
        points_reward=150,
        share_to_story_template="7-day streak! Week warrior activated! ⚡"
    ),
    AchievementDefinition(
        id="streak_30_days",
        title="Monthly Master",
        description="Study for 30 days in a row",
        icon="👑",
        category=AchievementCategory.STREAK,
        rarity=AchievementRarity.EPIC,
        requirement_type="streak_days",
        requirement_value=30,
        points_reward=500,
        share_to_story_template="30-day streak! I'm unstoppable! 👑"
    ),
    AchievementDefinition(
        id="streak_100_days",
        title="Century Champion",
        description="Study for 100 days straight",
        icon="💎",
        category=AchievementCategory.STREAK,
        rarity=AchievementRarity.LEGENDARY,
        requirement_type="streak_days",
        requirement_value=100,
        points_reward=2000,
        share_to_story_template="100-day streak! Century champion! 💎"
    ),

    # === CARDS ACHIEVEMENTS ===
    AchievementDefinition(
        id="cards_100",
        title="Card Collector",
        description="Review 100 cards total",
        icon="📚",
        category=AchievementCategory.CARDS,
        rarity=AchievementRarity.COMMON,
        requirement_type="cards_reviewed",
        requirement_value=100,
        points_reward=100,
        share_to_story_template="100 cards reviewed! Card collector unlocked! 📚"
    ),
    AchievementDefinition(
        id="cards_1000",
        title="Knowledge Seeker",
        description="Review 1,000 cards total",
        icon="🎓",
        category=AchievementCategory.CARDS,
        rarity=AchievementRarity.RARE,
        requirement_type="cards_reviewed",
        requirement_value=1000,
        points_reward=500,
        share_to_story_template="1,000 cards reviewed! Knowledge seeker! 🎓"
    ),
    AchievementDefinition(
        id="cards_10000",
        title="Master Learner",
        description="Review 10,000 cards total",
        icon="🏆",
        category=AchievementCategory.CARDS,
        rarity=AchievementRarity.LEGENDARY,
        requirement_type="cards_reviewed",
        requirement_value=10000,
        points_reward=5000,
        share_to_story_template="10,000 cards! I'm a master learner! 🏆"
    ),

    # === SOCIAL ACHIEVEMENTS ===
    AchievementDefinition(
        id="followers_10",
        title="Popular Student",
        description="Get 10 followers",
        icon="⭐",
        category=AchievementCategory.SOCIAL,
        rarity=AchievementRarity.COMMON,
        requirement_type="followers_count",
        requirement_value=10,
        points_reward=100
    ),
    AchievementDefinition(
        id="followers_100",
        title="Influencer",
        description="Get 100 followers",
        icon="🌟",
        category=AchievementCategory.SOCIAL,
        rarity=AchievementRarity.EPIC,
        requirement_type="followers_count",
        requirement_value=100,
        points_reward=1000
    ),
    AchievementDefinition(
        id="deck_saves_50",
        title="Content Creator",
        description="Get 50 saves on your decks",
        icon="✨",
        category=AchievementCategory.SOCIAL,
        rarity=AchievementRarity.RARE,
        requirement_type="deck_saves",
        requirement_value=50,
        points_reward=500
    ),

    # === LEARNING ACHIEVEMENTS ===
    AchievementDefinition(
        id="perfect_session",
        title="Perfect Session",
        description="Review 20+ cards with 100% accuracy",
        icon="💯",
        category=AchievementCategory.LEARNING,
        rarity=AchievementRarity.RARE,
        requirement_type="perfect_session",
        requirement_value=20,
        points_reward=200,
        share_to_story_template="Perfect session! 100% accuracy! 💯"
    ),
    AchievementDefinition(
        id="night_owl",
        title="Night Owl",
        description="Study after midnight",
        icon="🦉",
        category=AchievementCategory.LEARNING,
        rarity=AchievementRarity.COMMON,
        requirement_type="study_after_midnight",
        requirement_value=1,
        points_reward=50,
        is_hidden=True
    ),
    AchievementDefinition(
        id="early_bird",
        title="Early Bird",
        description="Study before 6 AM",
        icon="🐦",
        category=AchievementCategory.LEARNING,
        rarity=AchievementRarity.COMMON,
        requirement_type="study_before_6am",
        requirement_value=1,
        points_reward=50,
        is_hidden=True
    ),
]
