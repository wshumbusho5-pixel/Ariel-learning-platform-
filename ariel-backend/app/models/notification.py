"""
Notification Models - Real-time notifications for social interactions
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    # Social
    NEW_FOLLOWER = "new_follower"  # Someone followed you
    FOLLOW_BACK = "follow_back"  # Someone you followed, followed you back

    # Deck Interactions
    DECK_LIKE = "deck_like"  # Someone liked your deck
    DECK_SAVE = "deck_save"  # Someone saved your deck
    DECK_COMMENT = "deck_comment"  # Someone commented on your deck
    COMMENT_REPLY = "comment_reply"  # Someone replied to your comment

    # Achievements & Streaks
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"  # You unlocked an achievement
    FRIEND_ACHIEVEMENT = "friend_achievement"  # Friend unlocked achievement
    STREAK_MILESTONE = "streak_milestone"  # You hit a streak milestone (7, 30, 100 days)
    STREAK_RISK = "streak_risk"  # Your streak is about to break (reminder)

    # Stories
    STORY_VIEW = "story_view"  # Someone viewed your story
    STORY_MILESTONE = "story_milestone"  # Your story reached X views

    # Study & Learning
    DAILY_GOAL_MET = "daily_goal_met"  # You met your daily goal
    STUDY_REMINDER = "study_reminder"  # Reminder to review cards

    # Messages
    NEW_MESSAGE = "new_message"  # New direct message

    # Community
    TRENDING_DECK = "trending_deck"  # Your deck is trending
    LEADERBOARD_RANK = "leaderboard_rank"  # You moved up in leaderboard

    # Duels
    DUEL_CHALLENGE = "duel_challenge"  # Someone challenged you to a duel


class Notification(BaseModel):
    """
    User notification
    """
    id: Optional[str] = None
    user_id: str  # Recipient

    # Notification details
    notification_type: NotificationType
    title: str
    message: str
    icon: Optional[str] = None  # Emoji or icon name

    # Actor (who triggered this notification)
    actor_id: Optional[str] = None  # User who performed action
    actor_username: Optional[str] = None
    actor_full_name: Optional[str] = None
    actor_profile_picture: Optional[str] = None

    # Related entities
    related_deck_id: Optional[str] = None
    related_comment_id: Optional[str] = None
    related_achievement_id: Optional[str] = None
    related_story_id: Optional[str] = None

    # Additional data
    metadata: Dict[str, Any] = {}  # Extra data like streak count, view count, etc.

    # Action URL (where to navigate when clicked)
    action_url: Optional[str] = None

    # Status
    is_read: bool = False
    is_archived: bool = False

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None


class NotificationPreferences(BaseModel):
    """
    User's notification preferences
    """
    id: Optional[str] = None
    user_id: str

    # Push notifications (in-app)
    enable_push: bool = True

    # Category preferences
    social_notifications: bool = True  # Follows, likes, comments
    achievement_notifications: bool = True  # Achievement unlocks
    streak_notifications: bool = True  # Streak reminders
    study_notifications: bool = True  # Study reminders, daily goals
    message_notifications: bool = True  # Direct messages

    # Specific toggles
    notify_new_follower: bool = True
    notify_deck_like: bool = True
    notify_deck_save: bool = True
    notify_deck_comment: bool = True
    notify_achievement_unlock: bool = True
    notify_friend_achievement: bool = True
    notify_streak_risk: bool = True  # Warning before streak breaks
    notify_daily_goal_met: bool = True
    notify_new_message: bool = True

    # Quiet hours
    quiet_hours_enabled: bool = False
    quiet_hours_start: Optional[str] = "22:00"  # HH:MM format
    quiet_hours_end: Optional[str] = "07:00"

    updated_at: datetime = Field(default_factory=datetime.utcnow)


class NotificationSummary(BaseModel):
    """
    Summary of notifications for user
    """
    total_count: int
    unread_count: int
    unread_by_type: Dict[str, int]  # Count per notification type
    latest_notifications: list  # Last 5 notifications


# Notification templates for quick creation
NOTIFICATION_TEMPLATES = {
    NotificationType.NEW_FOLLOWER: {
        "title": "{actor_name} started following you",
        "message": "Tap to view their profile",
        "icon": "👤"
    },
    NotificationType.FOLLOW_BACK: {
        "title": "{actor_name} followed you back!",
        "message": "You're now following each other",
        "icon": "🤝"
    },
    NotificationType.DECK_LIKE: {
        "title": "{actor_name} liked your deck",
        "message": "{deck_title}",
        "icon": "❤️"
    },
    NotificationType.DECK_SAVE: {
        "title": "{actor_name} saved your deck",
        "message": "{deck_title}",
        "icon": "⭐"
    },
    NotificationType.DECK_COMMENT: {
        "title": "{actor_name} commented on your deck",
        "message": "{comment_preview}",
        "icon": "💬"
    },
    NotificationType.COMMENT_REPLY: {
        "title": "{actor_name} replied to your comment",
        "message": "{comment_preview}",
        "icon": "↩️"
    },
    NotificationType.ACHIEVEMENT_UNLOCKED: {
        "title": "Achievement unlocked!",
        "message": "{achievement_title} - +{points} points",
        "icon": "🏆"
    },
    NotificationType.FRIEND_ACHIEVEMENT: {
        "title": "{actor_name} unlocked an achievement",
        "message": "{achievement_title}",
        "icon": "🎉"
    },
    NotificationType.STREAK_MILESTONE: {
        "title": "{streak_count}-day streak! 🔥",
        "message": "Keep the momentum going!",
        "icon": "🔥"
    },
    NotificationType.STREAK_RISK: {
        "title": "Don't break your streak!",
        "message": "Review cards today to keep your {streak_count}-day streak alive",
        "icon": "⚠️"
    },
    NotificationType.DAILY_GOAL_MET: {
        "title": "Daily goal complete! ✓",
        "message": "You reviewed {cards_count} cards today",
        "icon": "✅"
    },
    NotificationType.STUDY_REMINDER: {
        "title": "Time to review!",
        "message": "You have {cards_count} cards due",
        "icon": "📚"
    },
    NotificationType.NEW_MESSAGE: {
        "title": "New message from {actor_name}",
        "message": "{message_preview}",
        "icon": "💬"
    },
    NotificationType.TRENDING_DECK: {
        "title": "Your deck is trending! 🔥",
        "message": "{deck_title} - {views_count} views",
        "icon": "📈"
    },
    NotificationType.LEADERBOARD_RANK: {
        "title": "You're now #{rank} on the leaderboard!",
        "message": "Keep studying to climb higher",
        "icon": "🏆"
    },
}
