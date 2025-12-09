"""
Challenge Models - Weekly challenges and competitions
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from enum import Enum


class ChallengeType(str, Enum):
    CARDS_REVIEWED = "cards_reviewed"  # Review X cards
    STREAK_DAYS = "streak_days"  # Maintain X day streak
    STUDY_TIME = "study_time"  # Study for X minutes
    DECKS_CREATED = "decks_created"  # Create X decks
    SOCIAL_ENGAGEMENT = "social_engagement"  # Get X likes/saves


class ChallengeStatus(str, Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"


class Challenge(BaseModel):
    """
    Weekly challenge
    """
    id: Optional[str] = None

    # Challenge details
    title: str
    description: str
    icon: str
    challenge_type: ChallengeType
    target_value: int  # Goal to achieve

    # Rewards
    points_reward: int
    badge_reward: Optional[str] = None

    # Duration
    status: ChallengeStatus = ChallengeStatus.ACTIVE
    start_date: datetime
    end_date: datetime

    # Participants
    participant_count: int = 0
    completion_count: int = 0

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserChallengeProgress(BaseModel):
    """
    User's progress on a challenge
    """
    id: Optional[str] = None
    user_id: str
    challenge_id: str

    # Progress
    current_value: int = 0
    target_value: int
    percentage: int = 0

    # Status
    is_joined: bool = True
    is_completed: bool = False
    completed_at: Optional[datetime] = None

    # Rewards
    points_earned: int = 0

    # Timestamps
    joined_at: datetime = Field(default_factory=datetime.utcnow)


class ChallengeWithProgress(BaseModel):
    """
    Challenge with user's progress
    """
    id: str
    title: str
    description: str
    icon: str
    challenge_type: ChallengeType
    target_value: int
    points_reward: int
    badge_reward: Optional[str]

    # Status
    status: ChallengeStatus
    start_date: datetime
    end_date: datetime
    days_remaining: int

    # Stats
    participant_count: int
    completion_count: int
    completion_rate: int

    # User progress
    current_value: int
    percentage: int
    is_joined: bool
    is_completed: bool


class LeaderboardEntry(BaseModel):
    """
    Challenge leaderboard entry
    """
    rank: int
    user_id: str
    username: Optional[str]
    full_name: Optional[str]
    profile_picture: Optional[str]
    is_verified: bool

    # Progress
    current_value: int
    target_value: int
    percentage: int
    is_completed: bool

    # Context
    is_current_user: bool
