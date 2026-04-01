"""
Stories API - 24-hour expiring status updates
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from app.core.database import get_database
from app.core.security import get_current_user
from app.models.user import User
from app.models.story import (
    Story, StoryCreate, StoryResponse, StoryView,
    StoryGroup, StoryTemplate, StoryType, StoryVisibility
)
from app.models.user import UserRole

router = APIRouter(prefix="/api/stories", tags=["stories"])


# ============== CREATE STORY ==============

@router.post("/", response_model=StoryResponse)
async def create_story(
    story_data: StoryCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Create a new story

    - Expires after 24 hours
    - Visible to followers by default
    """
    # Create story
    story = Story(
        user_id=str(current_user.id),
        story_type=story_data.story_type,
        content=story_data.content,
        background_color=story_data.background_color or "#667EEA",
        image_url=story_data.image_url,
        achievement_id=story_data.achievement_id,
        achievement_title=story_data.achievement_title,
        achievement_icon=story_data.achievement_icon,
        streak_count=story_data.streak_count,
        deck_id=story_data.deck_id,
        deck_title=story_data.deck_title,
        deck_subject=story_data.deck_subject,
        cards_reviewed=story_data.cards_reviewed,
        time_spent_minutes=story_data.time_spent_minutes,
        visibility=story_data.visibility
    )

    # Insert into database
    result = await db.stories.insert_one(story.dict(exclude={"id"}))
    story.id = str(result.inserted_id)

    # Return with author info
    time_remaining = (story.expires_at - datetime.utcnow()).total_seconds() / 3600

    return StoryResponse(
        id=story.id,
        user_id=story.user_id,
        story_type=story.story_type,
        content=story.content,
        background_color=story.background_color,
        image_url=story.image_url,
        achievement_id=story.achievement_id,
        achievement_title=story.achievement_title,
        achievement_icon=story.achievement_icon,
        streak_count=story.streak_count,
        deck_id=story.deck_id,
        deck_title=story.deck_title,
        deck_subject=story.deck_subject,
        cards_reviewed=story.cards_reviewed,
        time_spent_minutes=story.time_spent_minutes,
        visibility=story.visibility,
        views=0,
        author_username=current_user.username,
        author_full_name=current_user.full_name,
        author_profile_picture=current_user.profile_picture,
        author_is_verified=current_user.is_verified,
        has_viewed=False,
        created_at=story.created_at,
        expires_at=story.expires_at,
        time_remaining_hours=int(time_remaining)
    )


# ============== VIEW STORIES ==============

@router.get("/feed", response_model=List[StoryGroup])
async def get_story_feed(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get stories from people user follows

    Returns:
    - Stories grouped by user
    - Shows unviewed count
    - Ordered by latest story
    """
    # Get stories from following (not expired)
    cutoff_time = datetime.utcnow()

    query = {
        "user_id": {"$in": current_user.following},
        "expires_at": {"$gt": cutoff_time},
        "is_expired": False
    }

    # Check visibility
    query["$or"] = [
        {"visibility": StoryVisibility.PUBLIC},
        {"visibility": StoryVisibility.FOLLOWERS},
        {"visibility": StoryVisibility.FRIENDS, "user_id": {"$in": current_user.followers}}
    ]

    # Fetch stories
    stories_by_user = {}

    async for story in db.stories.find(query).sort("created_at", -1):
        user_id = story["user_id"]

        if user_id not in stories_by_user:
            stories_by_user[user_id] = []

        stories_by_user[user_id].append(story)

    # Build story groups
    story_groups = []

    for user_id, stories in stories_by_user.items():
        # Get user info
        author = await db.users.find_one({"_id": user_id})
        if not author:
            continue

        # Build story responses
        story_responses = []
        unviewed_count = 0

        for story in stories:
            has_viewed = str(current_user.id) in story.get("viewers", [])
            if not has_viewed:
                unviewed_count += 1

            time_remaining = (story["expires_at"] - datetime.utcnow()).total_seconds() / 3600

            story_responses.append(StoryResponse(
                id=str(story["_id"]),
                user_id=story["user_id"],
                story_type=story["story_type"],
                content=story["content"],
                background_color=story.get("background_color", "#667EEA"),
                image_url=story.get("image_url"),
                achievement_id=story.get("achievement_id"),
                achievement_title=story.get("achievement_title"),
                achievement_icon=story.get("achievement_icon"),
                streak_count=story.get("streak_count"),
                deck_id=story.get("deck_id"),
                deck_title=story.get("deck_title"),
                deck_subject=story.get("deck_subject"),
                cards_reviewed=story.get("cards_reviewed"),
                time_spent_minutes=story.get("time_spent_minutes"),
                visibility=story["visibility"],
                views=story.get("views", 0),
                author_username=author.get("username"),
                author_full_name=author.get("full_name"),
                author_profile_picture=author.get("profile_picture"),
                author_is_verified=author.get("is_verified", False),
                has_viewed=has_viewed,
                created_at=story["created_at"],
                expires_at=story["expires_at"],
                time_remaining_hours=int(time_remaining)
            ))

        # Create group
        story_groups.append(StoryGroup(
            user_id=user_id,
            username=author.get("username"),
            full_name=author.get("full_name"),
            profile_picture=author.get("profile_picture"),
            is_verified=author.get("is_verified", False),
            stories=story_responses,
            total_stories=len(story_responses),
            unviewed_count=unviewed_count,
            latest_story_time=stories[0]["created_at"]  # Already sorted by created_at desc
        ))

    # Sort groups: Unviewed first, then by latest story
    story_groups.sort(key=lambda g: (g.unviewed_count == 0, g.latest_story_time), reverse=False)

    return story_groups


@router.get("/my-stories", response_model=List[StoryResponse])
async def get_my_stories(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get current user's stories

    - Shows all active stories
    - Includes view count
    """
    cutoff_time = datetime.utcnow()

    stories = []
    async for story in db.stories.find({
        "user_id": str(current_user.id),
        "expires_at": {"$gt": cutoff_time},
        "is_expired": False
    }).sort("created_at", -1):
        time_remaining = (story["expires_at"] - datetime.utcnow()).total_seconds() / 3600

        stories.append(StoryResponse(
            id=str(story["_id"]),
            user_id=story["user_id"],
            story_type=story["story_type"],
            content=story["content"],
            background_color=story.get("background_color", "#667EEA"),
            image_url=story.get("image_url"),
            achievement_id=story.get("achievement_id"),
            achievement_title=story.get("achievement_title"),
            achievement_icon=story.get("achievement_icon"),
            streak_count=story.get("streak_count"),
            deck_id=story.get("deck_id"),
            deck_title=story.get("deck_title"),
            deck_subject=story.get("deck_subject"),
            cards_reviewed=story.get("cards_reviewed"),
            time_spent_minutes=story.get("time_spent_minutes"),
            visibility=story["visibility"],
            views=story.get("views", 0),
            author_username=current_user.username,
            author_full_name=current_user.full_name,
            author_profile_picture=current_user.profile_picture,
            author_is_verified=current_user.is_verified,
            has_viewed=True,
            created_at=story["created_at"],
            expires_at=story["expires_at"],
            time_remaining_hours=int(time_remaining)
        ))

    return stories


@router.get("/{story_id}", response_model=StoryResponse)
async def get_story(
    story_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get a single story by ID
    """
    try:
        oid = ObjectId(story_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid story ID")

    story = await db.stories.find_one({"_id": oid})
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )

    # Check if expired
    if story["expires_at"] < datetime.utcnow() or story.get("is_expired", False):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Story has expired"
        )

    # Get author
    author = await db.users.find_one({"_id": story["user_id"]})

    time_remaining = (story["expires_at"] - datetime.utcnow()).total_seconds() / 3600
    has_viewed = str(current_user.id) in story.get("viewers", [])

    return StoryResponse(
        id=str(story["_id"]),
        user_id=story["user_id"],
        story_type=story["story_type"],
        content=story["content"],
        background_color=story.get("background_color", "#667EEA"),
        image_url=story.get("image_url"),
        achievement_id=story.get("achievement_id"),
        achievement_title=story.get("achievement_title"),
        achievement_icon=story.get("achievement_icon"),
        streak_count=story.get("streak_count"),
        deck_id=story.get("deck_id"),
        deck_title=story.get("deck_title"),
        deck_subject=story.get("deck_subject"),
        cards_reviewed=story.get("cards_reviewed"),
        time_spent_minutes=story.get("time_spent_minutes"),
        visibility=story["visibility"],
        views=story.get("views", 0),
        author_username=author.get("username") if author else None,
        author_full_name=author.get("full_name") if author else None,
        author_profile_picture=author.get("profile_picture") if author else None,
        author_is_verified=author.get("is_verified", False) if author else False,
        has_viewed=has_viewed,
        created_at=story["created_at"],
        expires_at=story["expires_at"],
        time_remaining_hours=int(time_remaining)
    )


# ============== MARK STORY AS VIEWED ==============

@router.post("/{story_id}/view")
async def mark_story_viewed(
    story_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Mark a story as viewed

    - Adds user to viewers list
    - Increments view count
    """
    try:
        oid = ObjectId(story_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid story ID")

    story = await db.stories.find_one({"_id": oid})
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )

    current_user_id = str(current_user.id)

    # Check if already viewed
    if current_user_id in story.get("viewers", []):
        return {"success": True, "message": "Already viewed"}

    # Add to viewers and increment count
    await db.stories.update_one(
        {"_id": oid},
        {
            "$addToSet": {"viewers": current_user_id},
            "$inc": {"views": 1}
        }
    )

    return {"success": True, "message": "Story marked as viewed"}


# ============== DELETE STORY ==============

@router.delete("/{story_id}")
async def delete_story(
    story_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Delete a story

    - Only owner can delete
    """
    try:
        oid = ObjectId(story_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid story ID")

    story = await db.stories.find_one({"_id": oid})
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )

    if story["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own stories"
        )

    await db.stories.delete_one({"_id": oid})

    return {"success": True, "message": "Story deleted"}


# ============== STORY TEMPLATES ==============

@router.get("/templates/list", response_model=List[StoryTemplate])
async def get_story_templates():
    """
    Get pre-made story templates for quick creation
    """
    templates = [
        StoryTemplate(
            template_type=StoryType.STREAK,
            title="Streak Achievement",
            description="Share your study streak milestone",
            background_color="#FF6B6B",
            emoji="🔥",
            example_text="7-day streak! Can't stop, won't stop! 🔥"
        ),
        StoryTemplate(
            template_type=StoryType.STUDY_SESSION,
            title="Study Session",
            description="Share your study progress",
            background_color="#4ECDC4",
            emoji="📚",
            example_text="Just crushed 50 Biology cards in 30 minutes! 💪"
        ),
        StoryTemplate(
            template_type=StoryType.DECK_POST,
            title="New Deck",
            description="Announce your new deck post",
            background_color="#95E1D3",
            emoji="🎯",
            example_text="Just posted my Chemistry deck - check it out!"
        ),
        StoryTemplate(
            template_type=StoryType.ACHIEVEMENT,
            title="Achievement",
            description="Share an achievement badge",
            background_color="#F38181",
            emoji="🏆",
            example_text="Unlocked 'Master Learner' badge! 🏆"
        ),
        StoryTemplate(
            template_type=StoryType.TEXT,
            title="Custom",
            description="Create your own message",
            background_color="#667EEA",
            emoji="✨",
            example_text="Studying for finals... wish me luck! ✨"
        )
    ]

    return templates


# ============== CLEANUP EXPIRED STORIES (Background Job) ==============

@router.post("/admin/cleanup-expired")
async def cleanup_expired_stories(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Mark expired stories as expired

    This should be run as a background job (cron) every hour.
    Requires admin role.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    cutoff_time = datetime.utcnow()

    result = await db.stories.update_many(
        {
            "expires_at": {"$lt": cutoff_time},
            "is_expired": False
        },
        {
            "$set": {"is_expired": True}
        }
    )

    return {
        "success": True,
        "expired_count": result.modified_count,
        "message": f"Marked {result.modified_count} stories as expired"
    }
