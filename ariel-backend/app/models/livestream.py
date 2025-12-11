"""
LiveStream Models - Live streaming for educational content
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class StreamStatus(str, Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    ENDED = "ended"
    CANCELLED = "cancelled"


class StreamCategory(str, Enum):
    STUDY_SESSION = "study_session"
    LECTURE = "lecture"
    Q_AND_A = "q_and_a"
    TUTORIAL = "tutorial"
    EXAM_PREP = "exam_prep"
    DISCUSSION = "discussion"
    OTHER = "other"


class LiveStream(BaseModel):
    """
    Live stream session
    """
    id: Optional[str] = None
    streamer_id: str  # User who is streaming
    title: str
    description: Optional[str] = None
    category: StreamCategory
    subject: Optional[str] = None
    topic: Optional[str] = None

    # Stream details
    status: StreamStatus = StreamStatus.SCHEDULED
    stream_key: Optional[str] = None  # For broadcaster authentication
    stream_url: Optional[str] = None  # RTMP or WebRTC URL
    playback_url: Optional[str] = None  # For viewers
    thumbnail_url: Optional[str] = None

    # Scheduling
    scheduled_start: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    duration_minutes: int = 0

    # Engagement
    viewers_count: int = 0
    peak_viewers: int = 0
    likes_count: int = 0
    comments_count: int = 0

    # Settings
    is_public: bool = True
    allow_comments: bool = True
    allow_reactions: bool = True
    save_recording: bool = True

    # Recording
    recording_url: Optional[str] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class LiveStreamCreate(BaseModel):
    """Request to create/schedule a live stream"""
    title: str
    description: Optional[str] = None
    category: StreamCategory
    subject: Optional[str] = None
    topic: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    is_public: bool = True
    allow_comments: bool = True
    allow_reactions: bool = True
    save_recording: bool = True


class LiveStreamUpdate(BaseModel):
    """Update stream details"""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[StreamCategory] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    thumbnail_url: Optional[str] = None
    is_public: Optional[bool] = None
    allow_comments: Optional[bool] = None
    allow_reactions: Optional[bool] = None


class LiveStreamWithStreamer(BaseModel):
    """Stream with streamer info for display"""
    id: str
    streamer_id: str
    streamer_username: str
    streamer_profile_picture: Optional[str]
    streamer_verified: bool

    title: str
    description: Optional[str]
    category: StreamCategory
    subject: Optional[str]
    topic: Optional[str]

    status: StreamStatus
    playback_url: Optional[str]
    thumbnail_url: Optional[str]

    scheduled_start: Optional[datetime]
    actual_start: Optional[datetime]
    duration_minutes: int

    viewers_count: int
    peak_viewers: int
    likes_count: int
    comments_count: int

    is_public: bool
    allow_comments: bool
    allow_reactions: bool

    created_at: datetime

    # Viewer-specific
    is_liked_by_current_user: bool = False
    is_following_streamer: bool = False


class StreamComment(BaseModel):
    """Live stream comment/chat message"""
    id: Optional[str] = None
    stream_id: str
    user_id: str
    username: str
    profile_picture: Optional[str] = None
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Engagement
    likes: int = 0
    is_pinned: bool = False
    is_deleted: bool = False


class StreamReaction(BaseModel):
    """Real-time reaction (like, heart, clap, etc.)"""
    id: Optional[str] = None
    stream_id: str
    user_id: str
    reaction_type: str  # "like", "heart", "clap", "fire", etc.
    timestamp: datetime = Field(default_factory=datetime.utcnow)
