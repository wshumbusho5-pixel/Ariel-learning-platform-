"""
Activity Feed API - Social feed of user activities
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_database
from app.core.security import get_current_user
from app.models.user import User
from app.models.activity import Activity, ActivityWithUser, ActivityType

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("/feed", response_model=List[ActivityWithUser])
async def get_activity_feed(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    limit: int = 50,
    offset: int = 0
):
    """
    Get personalized activity feed

    - Shows activities from following
    - Shows own activities
    - Sorted by created_at descending
    """
    user_id = str(current_user.id)
    following = current_user.following or []

    # Get activities from following + self
    feed_user_ids = following + [user_id]

    activities = []
    async for activity in db.activities.find({
        "user_id": {"$in": feed_user_ids},
        "is_public": True
    }).sort("created_at", -1).skip(offset).limit(limit):

        # Get user info
        user = await db.users.find_one({"_id": activity["user_id"]})
        if not user:
            continue

        # Check if current user liked
        is_liked = user_id in activity.get("liked_by", [])

        activities.append(ActivityWithUser(
            id=str(activity["_id"]),
            user_id=activity["user_id"],
            activity_type=activity["activity_type"],
            title=activity["title"],
            description=activity.get("description"),
            icon=activity.get("icon"),
            username=user.get("username"),
            full_name=user.get("full_name"),
            profile_picture=user.get("profile_picture"),
            is_verified=user.get("is_verified", False),
            related_deck_id=activity.get("related_deck_id"),
            related_achievement_id=activity.get("related_achievement_id"),
            related_user_id=activity.get("related_user_id"),
            metadata=activity.get("metadata", {}),
            likes=activity.get("likes", 0),
            is_liked_by_current_user=is_liked,
            created_at=activity["created_at"]
        ))

    return activities


@router.post("/activity/{activity_id}/like")
async def toggle_activity_like(
    activity_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Toggle like on an activity
    """
    user_id = str(current_user.id)

    activity = await db.activities.find_one({"_id": activity_id})
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    liked_by = activity.get("liked_by", [])
    is_liked = user_id in liked_by

    if is_liked:
        await db.activities.update_one(
            {"_id": activity_id},
            {
                "$pull": {"liked_by": user_id},
                "$inc": {"likes": -1}
            }
        )
        return {"success": True, "action": "unliked", "likes": activity.get("likes", 1) - 1}
    else:
        await db.activities.update_one(
            {"_id": activity_id},
            {
                "$addToSet": {"liked_by": user_id},
                "$inc": {"likes": 1}
            }
        )
        return {"success": True, "action": "liked", "likes": activity.get("likes", 0) + 1}


# Helper function to create activity (called from other endpoints)
async def create_activity(
    db,
    user_id: str,
    activity_type: ActivityType,
    title: str,
    description: str = None,
    icon: str = None,
    related_deck_id: str = None,
    related_achievement_id: str = None,
    related_user_id: str = None,
    metadata: dict = None,
    is_public: bool = True
):
    """
    Helper to create activity
    """
    activity = Activity(
        user_id=user_id,
        activity_type=activity_type,
        title=title,
        description=description,
        icon=icon,
        related_deck_id=related_deck_id,
        related_achievement_id=related_achievement_id,
        related_user_id=related_user_id,
        metadata=metadata or {},
        is_public=is_public
    )

    result = await db.activities.insert_one(activity.dict(exclude={"id"}))
    return str(result.inserted_id)
