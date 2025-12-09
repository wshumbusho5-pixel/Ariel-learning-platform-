"""
Study Room Models - Collaborative study sessions
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RoomStatus(str, Enum):
    ACTIVE = "active"
    ENDED = "ended"
    SCHEDULED = "scheduled"


class StudyRoom(BaseModel):
    """
    Virtual study room for collaborative studying
    """
    id: Optional[str] = None
    host_id: str  # Room creator

    # Room details
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None

    # Participants
    participants: List[str] = []  # User IDs
    max_participants: int = 10

    # Status
    status: RoomStatus = RoomStatus.ACTIVE

    # Scheduled
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None

    # Activity tracking
    total_cards_reviewed: int = 0
    total_time_minutes: int = 0

    # Privacy
    is_public: bool = True
    is_invite_only: bool = False

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


class StudyRoomWithHost(BaseModel):
    """
    Study room with host information
    """
    id: str
    host_id: str
    title: str
    description: Optional[str]
    subject: Optional[str]
    topic: Optional[str]

    # Host info
    host_username: Optional[str]
    host_full_name: Optional[str]
    host_profile_picture: Optional[str]

    # Participants
    participant_count: int
    max_participants: int
    is_current_user_participant: bool

    # Status
    status: RoomStatus
    scheduled_start: Optional[datetime]

    # Activity
    total_cards_reviewed: int
    total_time_minutes: int

    # Privacy
    is_public: bool

    created_at: datetime


class StudyRoomCreate(BaseModel):
    """
    Request to create study room
    """
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    max_participants: int = 10
    is_public: bool = True
    scheduled_start: Optional[datetime] = None
