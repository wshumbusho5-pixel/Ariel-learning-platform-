"""
Challenges API - Weekly challenges and competitions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_database
from app.core.security import get_current_user
from app.models.user import User
from app.models.challenge import (
    Challenge, UserChallengeProgress, ChallengeWithProgress,
    LeaderboardEntry, ChallengeType, ChallengeStatus
)

router = APIRouter(prefix="/api/challenges", tags=["challenges"])


@router.get("/", response_model=List[ChallengeWithProgress])
async def get_challenges(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    status_filter: str = "active"
):
    """
    Get all challenges with user's progress
    """
    user_id = str(current_user.id)

    query = {}
    if status_filter != "all":
        query["status"] = status_filter

    challenges = []
    async for challenge in db.challenges.find(query).sort("start_date", -1):
        # Get user's progress
        progress = await db.user_challenge_progress.find_one({
            "user_id": user_id,
            "challenge_id": str(challenge["_id"])
        })

        current_value = progress.get("current_value", 0) if progress else 0
        is_joined = bool(progress)
        is_completed = progress.get("is_completed", False) if progress else False
        percentage = min(100, int((current_value / challenge["target_value"]) * 100))

        # Calculate days remaining
        end_date = challenge["end_date"]
        days_remaining = (end_date - datetime.utcnow()).days

        # Calculate completion rate
        completion_rate = 0
        if challenge["participant_count"] > 0:
            completion_rate = int((challenge["completion_count"] / challenge["participant_count"]) * 100)

        challenges.append(ChallengeWithProgress(
            id=str(challenge["_id"]),
            title=challenge["title"],
            description=challenge["description"],
            icon=challenge["icon"],
            challenge_type=challenge["challenge_type"],
            target_value=challenge["target_value"],
            points_reward=challenge["points_reward"],
            badge_reward=challenge.get("badge_reward"),
            status=challenge["status"],
            start_date=challenge["start_date"],
            end_date=challenge["end_date"],
            days_remaining=max(0, days_remaining),
            participant_count=challenge["participant_count"],
            completion_count=challenge["completion_count"],
            completion_rate=completion_rate,
            current_value=current_value,
            percentage=percentage,
            is_joined=is_joined,
            is_completed=is_completed
        ))

    return challenges


@router.post("/{challenge_id}/join")
async def join_challenge(
    challenge_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Join a challenge
    """
    user_id = str(current_user.id)

    # Check if challenge exists
    challenge = await db.challenges.find_one({"_id": challenge_id})
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    # Check if already joined
    existing = await db.user_challenge_progress.find_one({
        "user_id": user_id,
        "challenge_id": challenge_id
    })

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already joined this challenge"
        )

    # Create progress
    progress = UserChallengeProgress(
        user_id=user_id,
        challenge_id=challenge_id,
        target_value=challenge["target_value"]
    )

    await db.user_challenge_progress.insert_one(progress.dict(exclude={"id"}))

    # Increment participant count
    await db.challenges.update_one(
        {"_id": challenge_id},
        {"$inc": {"participant_count": 1}}
    )

    return {"success": True, "message": "Joined challenge"}


@router.get("/{challenge_id}/leaderboard", response_model=List[LeaderboardEntry])
async def get_challenge_leaderboard(
    challenge_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    limit: int = 50
):
    """
    Get challenge leaderboard
    """
    user_id = str(current_user.id)

    entries = []
    rank = 1

    async for progress in db.user_challenge_progress.find({
        "challenge_id": challenge_id
    }).sort("current_value", -1).limit(limit):

        user = await db.users.find_one({"_id": progress["user_id"]})
        if not user:
            continue

        percentage = min(100, int((progress["current_value"] / progress["target_value"]) * 100))

        entries.append(LeaderboardEntry(
            rank=rank,
            user_id=progress["user_id"],
            username=user.get("username"),
            full_name=user.get("full_name"),
            profile_picture=user.get("profile_picture"),
            is_verified=user.get("is_verified", False),
            current_value=progress["current_value"],
            target_value=progress["target_value"],
            percentage=percentage,
            is_completed=progress.get("is_completed", False),
            is_current_user=(progress["user_id"] == user_id)
        ))

        rank += 1

    return entries


# Helper function to update challenge progress
async def update_challenge_progress(
    db,
    user_id: str,
    challenge_type: ChallengeType,
    increment_value: int = 1
):
    """
    Update user's progress on active challenges
    """
    # Find active challenges of this type
    async for challenge in db.challenges.find({
        "challenge_type": challenge_type,
        "status": ChallengeStatus.ACTIVE
    }):
        challenge_id = str(challenge["_id"])

        # Get user's progress
        progress = await db.user_challenge_progress.find_one({
            "user_id": user_id,
            "challenge_id": challenge_id
        })

        if not progress:
            continue

        # Update progress
        new_value = progress["current_value"] + increment_value
        percentage = min(100, int((new_value / challenge["target_value"]) * 100))

        update_data = {
            "current_value": new_value,
            "percentage": percentage
        }

        # Check if completed
        if new_value >= challenge["target_value"] and not progress.get("is_completed"):
            update_data["is_completed"] = True
            update_data["completed_at"] = datetime.utcnow()
            update_data["points_earned"] = challenge["points_reward"]

            # Award points to user
            await db.users.update_one(
                {"_id": user_id},
                {"$inc": {"total_points": challenge["points_reward"]}}
            )

            # Increment completion count
            await db.challenges.update_one(
                {"_id": challenge_id},
                {"$inc": {"completion_count": 1}}
            )

        await db.user_challenge_progress.update_one(
            {"_id": progress["_id"]},
            {"$set": update_data}
        )
