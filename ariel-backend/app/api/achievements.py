"""
Achievements & Streaks API - Gamification system
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.core.database import get_database
from app.core.security import get_current_user
from app.models.user import User
from app.models.achievement import (
    AchievementDefinition, UserAchievement, StreakData, DailyActivity,
    AchievementProgress, LeaderboardEntry, ACHIEVEMENT_DEFINITIONS,
    AchievementCategory, AchievementRarity
)

router = APIRouter(prefix="/api/achievements", tags=["achievements"])


# ============== STREAK TRACKING ==============

@router.get("/streak")
async def get_streak(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get current user's streak data
    """
    streak_data = await db.streaks.find_one({"user_id": str(current_user.id)})

    if not streak_data:
        # Initialize streak for new user
        streak_data = StreakData(user_id=str(current_user.id))
        await db.streaks.insert_one(streak_data.dict(exclude={"id"}))

    return {
        "current_streak": streak_data.get("current_streak", 0),
        "longest_streak": streak_data.get("longest_streak", 0),
        "total_active_days": streak_data.get("total_active_days", 0),
        "last_activity_date": streak_data.get("last_activity_date"),
        "streak_start_date": streak_data.get("streak_start_date"),
        "freeze_cards_available": streak_data.get("freeze_cards_available", 3),
        "is_active_today": streak_data.get("last_activity_date") == str(date.today())
    }


@router.post("/streak/record-activity")
async def record_activity(
    cards_reviewed: int = 0,
    time_spent_minutes: int = 0,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Record daily activity and update streak

    This should be called after:
    - Reviewing cards
    - Completing study session
    - Any learning activity
    """
    user_id = str(current_user.id)
    today = date.today()

    # Get or create today's activity
    daily_activity = await db.daily_activities.find_one({
        "user_id": user_id,
        "activity_date": str(today)
    })

    if daily_activity:
        # Update existing activity
        await db.daily_activities.update_one(
            {"_id": daily_activity["_id"]},
            {
                "$inc": {
                    "cards_reviewed": cards_reviewed,
                    "time_spent_minutes": time_spent_minutes
                }
            }
        )
        total_cards = daily_activity["cards_reviewed"] + cards_reviewed
    else:
        # Create new daily activity
        daily_activity = DailyActivity(
            user_id=user_id,
            activity_date=today,
            cards_reviewed=cards_reviewed,
            time_spent_minutes=time_spent_minutes
        )
        await db.daily_activities.insert_one(daily_activity.dict(exclude={"id"}))
        total_cards = cards_reviewed

    # Check if daily goal met (20 cards)
    if total_cards >= 20:
        await db.daily_activities.update_one(
            {"user_id": user_id, "activity_date": str(today)},
            {"$set": {"daily_goal_met": True}}
        )

    # Update streak
    await update_streak(user_id, today, db)

    # Check for achievement unlocks
    await check_achievement_unlocks(user_id, db)

    return {"success": True, "message": "Activity recorded"}


async def update_streak(user_id: str, activity_date: date, db):
    """
    Update user's streak based on activity
    """
    streak_data = await db.streaks.find_one({"user_id": user_id})

    if not streak_data:
        # Initialize new streak
        streak_data = {
            "user_id": user_id,
            "current_streak": 1,
            "longest_streak": 1,
            "total_active_days": 1,
            "last_activity_date": str(activity_date),
            "streak_start_date": str(activity_date),
            "freeze_cards_available": 3,
            "freeze_cards_used": 0,
            "updated_at": datetime.utcnow()
        }
        await db.streaks.insert_one(streak_data)
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"current_streak": 1}}
        )
        return

    last_activity = date.fromisoformat(streak_data["last_activity_date"]) if streak_data.get("last_activity_date") else None

    if not last_activity:
        # First activity
        streak_data["current_streak"] = 1
        streak_data["longest_streak"] = 1
        streak_data["total_active_days"] = 1
        streak_data["last_activity_date"] = str(activity_date)
        streak_data["streak_start_date"] = str(activity_date)
    elif activity_date == last_activity:
        # Same day - no streak change
        return
    elif activity_date == last_activity + timedelta(days=1):
        # Consecutive day - increment streak!
        streak_data["current_streak"] += 1
        streak_data["total_active_days"] += 1
        streak_data["last_activity_date"] = str(activity_date)

        # Update longest streak if current is higher
        if streak_data["current_streak"] > streak_data["longest_streak"]:
            streak_data["longest_streak"] = streak_data["current_streak"]
    else:
        # Streak broken - reset
        streak_data["current_streak"] = 1
        streak_data["total_active_days"] += 1
        streak_data["last_activity_date"] = str(activity_date)
        streak_data["streak_start_date"] = str(activity_date)

    streak_data["updated_at"] = datetime.utcnow()

    # Update database
    await db.streaks.update_one(
        {"user_id": user_id},
        {"$set": streak_data}
    )

    # Update user's current_streak field
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"current_streak": streak_data["current_streak"]}}
    )


# ============== ACHIEVEMENTS ==============

@router.get("/list", response_model=List[AchievementProgress])
async def get_achievements(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    category: Optional[AchievementCategory] = None
):
    """
    Get all achievements with progress

    - Shows locked and unlocked
    - Calculates progress percentage
    - Filters by category if specified
    """
    user_id = str(current_user.id)

    # Get user's unlocked achievements
    unlocked = {}
    async for achievement in db.user_achievements.find({"user_id": user_id}):
        unlocked[achievement["achievement_id"]] = achievement

    # Get user stats for progress calculation
    stats = await get_user_stats(user_id, db)

    # Build achievement progress list
    achievements = []

    for definition in ACHIEVEMENT_DEFINITIONS:
        # Filter by category
        if category and definition.category != category:
            continue

        # Skip hidden achievements if not unlocked
        if definition.is_hidden and definition.id not in unlocked:
            continue

        # Calculate progress
        current_value = stats.get(definition.requirement_type, 0)
        percentage = min(100, int((current_value / definition.requirement_value) * 100))

        is_unlocked = definition.id in unlocked
        unlocked_at = unlocked[definition.id]["unlocked_at"] if is_unlocked else None

        achievements.append(AchievementProgress(
            achievement_id=definition.id,
            title=definition.title,
            description=definition.description,
            icon=definition.icon,
            category=definition.category,
            rarity=definition.rarity,
            current_value=current_value,
            target_value=definition.requirement_value,
            percentage=percentage,
            is_unlocked=is_unlocked,
            unlocked_at=unlocked_at,
            points_reward=definition.points_reward
        ))

    # Sort: Unlocked first, then by progress
    achievements.sort(key=lambda x: (not x.is_unlocked, -x.percentage))

    return achievements


@router.get("/unlocked")
async def get_unlocked_achievements(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get user's unlocked achievements only
    """
    user_id = str(current_user.id)

    unlocked = []
    async for achievement in db.user_achievements.find({"user_id": user_id}).sort("unlocked_at", -1):
        # Find definition
        definition = next((a for a in ACHIEVEMENT_DEFINITIONS if a.id == achievement["achievement_id"]), None)

        if definition:
            unlocked.append({
                "id": str(achievement["_id"]),
                "achievement_id": achievement["achievement_id"],
                "title": definition.title,
                "description": definition.description,
                "icon": definition.icon,
                "category": definition.category,
                "rarity": definition.rarity,
                "points_reward": definition.points_reward,
                "unlocked_at": achievement["unlocked_at"],
                "shared_to_story": achievement.get("shared_to_story", False),
                "is_pinned": achievement.get("is_pinned", False)
            })

    return unlocked


@router.post("/share-to-story/{achievement_id}")
async def share_achievement_to_story(
    achievement_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Share achievement to story

    - Creates a story with achievement
    - Marks achievement as shared
    """
    user_id = str(current_user.id)

    # Check if user has this achievement
    user_achievement = await db.user_achievements.find_one({
        "user_id": user_id,
        "achievement_id": achievement_id
    })

    if not user_achievement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Achievement not unlocked"
        )

    # Find definition
    definition = next((a for a in ACHIEVEMENT_DEFINITIONS if a.id == achievement_id), None)
    if not definition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Achievement definition not found"
        )

    # Create story
    story_content = definition.share_to_story_template or f"Just unlocked '{definition.title}'! {definition.icon}"

    story = {
        "user_id": user_id,
        "story_type": "achievement",
        "content": story_content,
        "background_color": "#F38181",  # Achievement color
        "achievement_id": achievement_id,
        "achievement_title": definition.title,
        "achievement_icon": definition.icon,
        "visibility": "followers",
        "views": 0,
        "viewers": [],
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24),
        "is_expired": False
    }

    result = await db.stories.insert_one(story)

    # Mark as shared
    await db.user_achievements.update_one(
        {"_id": user_achievement["_id"]},
        {
            "$set": {
                "shared_to_story": True,
                "shared_at": datetime.utcnow()
            }
        }
    )

    return {
        "success": True,
        "story_id": str(result.inserted_id),
        "message": "Achievement shared to story!"
    }


# ============== LEADERBOARDS ==============

@router.get("/leaderboard/streaks", response_model=List[LeaderboardEntry])
async def get_streak_leaderboard(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    limit: int = 50
):
    """
    Get top users by current streak
    """
    current_user_id = str(current_user.id)

    entries = []
    rank = 1

    async for streak in db.streaks.find().sort("current_streak", -1).limit(limit):
        user = await db.users.find_one({"_id": streak["user_id"]})
        if not user:
            continue

        # Count achievements
        achievements_count = await db.user_achievements.count_documents({"user_id": streak["user_id"]})

        entries.append(LeaderboardEntry(
            rank=rank,
            user_id=streak["user_id"],
            username=user.get("username"),
            full_name=user.get("full_name"),
            profile_picture=user.get("profile_picture"),
            is_verified=user.get("is_verified", False),
            current_streak=streak.get("current_streak", 0),
            total_points=user.get("total_points", 0),
            achievements_count=achievements_count,
            is_current_user=(streak["user_id"] == current_user_id)
        ))

        rank += 1

    return entries


# ============== HELPER FUNCTIONS ==============

async def get_user_stats(user_id: str, db) -> dict:
    """
    Get user's stats for achievement progress calculation
    """
    user = await db.users.find_one({"_id": user_id})
    streak_data = await db.streaks.find_one({"user_id": user_id})

    # Count total cards reviewed
    total_cards = 0
    async for activity in db.daily_activities.find({"user_id": user_id}):
        total_cards += activity.get("cards_reviewed", 0)

    # Count deck saves
    total_deck_saves = 0
    async for deck in db.decks.find({"user_id": user_id}):
        total_deck_saves += deck.get("saves", 0)

    return {
        "streak_days": streak_data.get("current_streak", 0) if streak_data else 0,
        "cards_reviewed": total_cards,
        "followers_count": user.get("followers_count", 0) if user else 0,
        "deck_saves": total_deck_saves
    }


async def check_achievement_unlocks(user_id: str, db):
    """
    Check if user unlocked any new achievements

    This runs after every activity
    """
    stats = await get_user_stats(user_id, db)

    # Get already unlocked
    unlocked_ids = set()
    async for achievement in db.user_achievements.find({"user_id": user_id}):
        unlocked_ids.add(achievement["achievement_id"])

    # Check each achievement
    newly_unlocked = []

    for definition in ACHIEVEMENT_DEFINITIONS:
        # Skip if already unlocked
        if definition.id in unlocked_ids:
            continue

        # Check if criteria met
        current_value = stats.get(definition.requirement_type, 0)

        if current_value >= definition.requirement_value:
            # Unlock achievement!
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_id=definition.id,
                progress_at_unlock=current_value
            )

            await db.user_achievements.insert_one(user_achievement.dict(exclude={"id"}))

            # Award points
            await db.users.update_one(
                {"_id": user_id},
                {"$inc": {"total_points": definition.points_reward}}
            )

            newly_unlocked.append({
                "achievement_id": definition.id,
                "title": definition.title,
                "icon": definition.icon,
                "points": definition.points_reward
            })

    return newly_unlocked
