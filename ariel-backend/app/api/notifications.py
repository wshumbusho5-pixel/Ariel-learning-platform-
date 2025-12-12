"""
Notifications API - Real-time notifications for social interactions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta

from app.services.database_service import db_service
from app.api.auth import get_current_user_dependency
from app.models.user import User
from app.models.notification import (
    Notification, NotificationPreferences, NotificationSummary,
    NotificationType, NOTIFICATION_TEMPLATES
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ============== GET NOTIFICATIONS ==============

@router.get("/", response_model=List[Notification])
async def get_notifications(
    current_user: User = Depends(get_current_user_dependency),
    limit: int = 50,
    offset: int = 0,
    unread_only: bool = False,
    notification_type: Optional[str] = None
):
    """
    Get user's notifications

    - Paginated with limit/offset
    - Filter by unread_only
    - Filter by notification_type
    - Sorted by created_at descending
    """
    db = db_service.get_db()
    user_id = str(current_user.id)

    # Build query
    query = {"user_id": user_id, "is_archived": False}

    if unread_only:
        query["is_read"] = False

    if notification_type:
        query["notification_type"] = notification_type

    # Get notifications
    notifications = []
    async for notification in db.notifications.find(query).sort("created_at", -1).skip(offset).limit(limit):
        notifications.append({
            "id": str(notification["_id"]),
            "user_id": notification["user_id"],
            "notification_type": notification["notification_type"],
            "title": notification["title"],
            "message": notification["message"],
            "icon": notification.get("icon"),
            "actor_id": notification.get("actor_id"),
            "actor_username": notification.get("actor_username"),
            "actor_full_name": notification.get("actor_full_name"),
            "actor_profile_picture": notification.get("actor_profile_picture"),
            "related_deck_id": notification.get("related_deck_id"),
            "related_comment_id": notification.get("related_comment_id"),
            "related_achievement_id": notification.get("related_achievement_id"),
            "related_story_id": notification.get("related_story_id"),
            "metadata": notification.get("metadata", {}),
            "action_url": notification.get("action_url"),
            "is_read": notification.get("is_read", False),
            "is_archived": notification.get("is_archived", False),
            "created_at": notification["created_at"],
            "read_at": notification.get("read_at")
        })

    return notifications


@router.get("/summary", response_model=NotificationSummary)
async def get_notification_summary(
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Get notification summary

    - Total count
    - Unread count
    - Unread by type
    - Latest 5 notifications
    """
    db = db_service.get_db()
    user_id = str(current_user.id)

    # Total count
    total_count = await db.notifications.count_documents({
        "user_id": user_id,
        "is_archived": False
    })

    # Unread count
    unread_count = await db.notifications.count_documents({
        "user_id": user_id,
        "is_read": False,
        "is_archived": False
    })

    # Unread by type
    unread_by_type = {}
    async for notification in db.notifications.find({
        "user_id": user_id,
        "is_read": False,
        "is_archived": False
    }):
        notif_type = notification["notification_type"]
        unread_by_type[notif_type] = unread_by_type.get(notif_type, 0) + 1

    # Latest notifications
    latest_notifications = []
    async for notification in db.notifications.find({
        "user_id": user_id,
        "is_archived": False
    }).sort("created_at", -1).limit(5):
        latest_notifications.append({
            "id": str(notification["_id"]),
            "notification_type": notification["notification_type"],
            "title": notification["title"],
            "message": notification["message"],
            "icon": notification.get("icon"),
            "is_read": notification.get("is_read", False),
            "created_at": notification["created_at"]
        })

    return NotificationSummary(
        total_count=total_count,
        unread_count=unread_count,
        unread_by_type=unread_by_type,
        latest_notifications=latest_notifications
    )


# ============== MARK AS READ ==============

@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Mark notification as read
    """
    db = db_service.get_db()
    user_id = str(current_user.id)

    # Find notification
    notification = await db.notifications.find_one({
        "_id": notification_id,
        "user_id": user_id
    })

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # Update
    await db.notifications.update_one(
        {"_id": notification_id},
        {
            "$set": {
                "is_read": True,
                "read_at": datetime.utcnow()
            }
        }
    )

    return {"success": True, "message": "Notification marked as read"}


@router.post("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Mark all notifications as read
    """
    db = db_service.get_db()
    user_id = str(current_user.id)

    result = await db.notifications.update_many(
        {"user_id": user_id, "is_read": False},
        {
            "$set": {
                "is_read": True,
                "read_at": datetime.utcnow()
            }
        }
    )

    return {
        "success": True,
        "message": f"Marked {result.modified_count} notifications as read"
    }


# ============== ARCHIVE/DELETE ==============

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Archive notification (soft delete)
    """
    db = db_service.get_db()
    user_id = str(current_user.id)

    result = await db.notifications.update_one(
        {"_id": notification_id, "user_id": user_id},
        {"$set": {"is_archived": True}}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return {"success": True, "message": "Notification archived"}


@router.post("/clear-all")
async def clear_all_notifications(
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Archive all notifications
    """
    db = db_service.get_db()
    user_id = str(current_user.id)

    result = await db.notifications.update_many(
        {"user_id": user_id, "is_archived": False},
        {"$set": {"is_archived": True}}
    )

    return {
        "success": True,
        "message": f"Cleared {result.modified_count} notifications"
    }


# ============== PREFERENCES ==============

@router.get("/preferences", response_model=NotificationPreferences)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Get notification preferences
    """
    db = db_service.get_db()
    user_id = str(current_user.id)

    prefs = await db.notification_preferences.find_one({"user_id": user_id})

    if not prefs:
        # Create default preferences
        prefs = NotificationPreferences(user_id=user_id)
        await db.notification_preferences.insert_one(prefs.dict(exclude={"id"}))
        return prefs

    return NotificationPreferences(**prefs)


@router.put("/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Update notification preferences
    """
    db = db_service.get_db()
    user_id = str(current_user.id)
    preferences.user_id = user_id
    preferences.updated_at = datetime.utcnow()

    await db.notification_preferences.update_one(
        {"user_id": user_id},
        {"$set": preferences.dict(exclude={"id"})},
        upsert=True
    )

    return {"success": True, "message": "Preferences updated"}


# ============== HELPER: CREATE NOTIFICATION ==============

async def create_notification(
    db,
    user_id: str,
    notification_type: NotificationType,
    actor_id: Optional[str] = None,
    related_deck_id: Optional[str] = None,
    related_comment_id: Optional[str] = None,
    related_achievement_id: Optional[str] = None,
    related_story_id: Optional[str] = None,
    metadata: dict = None,
    custom_title: str = None,
    custom_message: str = None
) -> dict:
    """
    Helper function to create a notification

    This can be called from other API endpoints (follow, like, etc.)
    """
    # Check user's preferences
    prefs = await db.notification_preferences.find_one({"user_id": user_id})

    if prefs:
        # Check if this notification type is enabled
        if not prefs.get("enable_push", True):
            return {"success": False, "reason": "Push notifications disabled"}

        # Check specific preferences
        pref_mapping = {
            NotificationType.NEW_FOLLOWER: "notify_new_follower",
            NotificationType.DECK_LIKE: "notify_deck_like",
            NotificationType.DECK_SAVE: "notify_deck_save",
            NotificationType.DECK_COMMENT: "notify_deck_comment",
            NotificationType.ACHIEVEMENT_UNLOCKED: "notify_achievement_unlock",
            NotificationType.FRIEND_ACHIEVEMENT: "notify_friend_achievement",
            NotificationType.STREAK_RISK: "notify_streak_risk",
            NotificationType.DAILY_GOAL_MET: "notify_daily_goal_met",
            NotificationType.NEW_MESSAGE: "notify_new_message",
        }

        pref_key = pref_mapping.get(notification_type)
        if pref_key and not prefs.get(pref_key, True):
            return {"success": False, "reason": f"{pref_key} disabled"}

    # Get actor info if provided
    actor_username = None
    actor_full_name = None
    actor_profile_picture = None

    if actor_id:
        actor = await db.users.find_one({"_id": actor_id})
        if actor:
            actor_username = actor.get("username")
            actor_full_name = actor.get("full_name")
            actor_profile_picture = actor.get("profile_picture")

    # Get template
    template = NOTIFICATION_TEMPLATES.get(notification_type, {})

    # Build title and message
    title = custom_title or template.get("title", "Notification")
    message = custom_message or template.get("message", "")
    icon = template.get("icon")

    # Replace placeholders
    if actor_full_name or actor_username:
        actor_name = actor_full_name or actor_username
        title = title.replace("{actor_name}", actor_name)
        message = message.replace("{actor_name}", actor_name)

    if metadata:
        for key, value in metadata.items():
            title = title.replace(f"{{{key}}}", str(value))
            message = message.replace(f"{{{key}}}", str(value))

    # Build action URL
    action_url = None
    if related_deck_id:
        action_url = f"/decks/{related_deck_id}"
    elif actor_id and notification_type == NotificationType.NEW_FOLLOWER:
        action_url = f"/profile/{actor_id}"
    elif related_achievement_id:
        action_url = "/achievements"

    # Create notification
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        icon=icon,
        actor_id=actor_id,
        actor_username=actor_username,
        actor_full_name=actor_full_name,
        actor_profile_picture=actor_profile_picture,
        related_deck_id=related_deck_id,
        related_comment_id=related_comment_id,
        related_achievement_id=related_achievement_id,
        related_story_id=related_story_id,
        metadata=metadata or {},
        action_url=action_url
    )

    result = await db.notifications.insert_one(notification.dict(exclude={"id"}))

    return {
        "success": True,
        "notification_id": str(result.inserted_id)
    }
