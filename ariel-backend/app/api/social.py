"""
Social API - Follow/Unfollow, User Profiles, Social Feed, Deck Posting
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.services.database_service import db_service
from app.api.auth import get_current_user_dependency
from app.models.user import User
from app.models.deck import Deck, DeckCreate, DeckUpdate, DeckPost, DeckVisibility, DeckComment
from app.models.activity import ActivityType
from app.services.feed_algorithm import FeedAlgorithm, enrich_deck_with_author
from app.api.activity_feed import create_activity

router = APIRouter(prefix="/api/social", tags=["social"])


# ============== REQUEST/RESPONSE MODELS ==============

class FollowRequest(BaseModel):
    """Request to follow a user"""
    user_id: str

class FollowResponse(BaseModel):
    """Response after follow/unfollow"""
    success: bool
    message: str
    is_following: bool
    followers_count: int

class UserProfileResponse(BaseModel):
    """Public user profile data"""
    id: str
    username: Optional[str]
    full_name: Optional[str]
    bio: Optional[str]
    profile_picture: Optional[str]
    education_level: Optional[str]
    subjects: List[str]
    school: Optional[str]
    is_teacher: bool
    is_verified: bool

    # Stats
    followers_count: int
    following_count: int
    total_points: int
    current_streak: int
    level: int

    # Social context
    is_following: bool = False  # Does current user follow this profile?
    follows_you: bool = False   # Does this profile follow current user?

    created_at: datetime

class FollowListItem(BaseModel):
    """User item in followers/following list"""
    id: str
    username: Optional[str]
    full_name: Optional[str]
    profile_picture: Optional[str]
    bio: Optional[str]
    is_following: bool
    is_teacher: bool
    is_verified: bool


# ============== ENDPOINTS ==============

@router.post("/follow", response_model=FollowResponse)
async def follow_user(
    request: FollowRequest,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Follow a user

    - Adds target user to current user's following list
    - Adds current user to target user's followers list
    - Updates follower/following counts
    """
    target_user_id = request.user_id
    current_user_id = str(current_user.id)

    # Can't follow yourself
    if target_user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself"
        )

    # Check if target user exists
    target_user = await db.users.find_one({"_id": target_user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if already following
    current_user_data = await db.users.find_one({"_id": current_user_id})
    if target_user_id in current_user_data.get("following", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already following this user"
        )

    # Add to following list (current user follows target)
    await db.users.update_one(
        {"_id": current_user_id},
        {
            "$addToSet": {"following": target_user_id},
            "$inc": {"following_count": 1}
        }
    )

    # Add to followers list (target gets new follower)
    await db.users.update_one(
        {"_id": target_user_id},
        {
            "$addToSet": {"followers": current_user_id},
            "$inc": {"followers_count": 1}
        }
    )

    # Get updated follower count
    updated_target = await db.users.find_one({"_id": target_user_id})

    return FollowResponse(
        success=True,
        message=f"You are now following {target_user.get('username', 'this user')}",
        is_following=True,
        followers_count=updated_target.get("followers_count", 0)
    )


@router.post("/unfollow", response_model=FollowResponse)
async def unfollow_user(
    request: FollowRequest,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Unfollow a user

    - Removes target user from current user's following list
    - Removes current user from target user's followers list
    - Updates follower/following counts
    """
    target_user_id = request.user_id
    current_user_id = str(current_user.id)

    # Check if target user exists
    target_user = await db.users.find_one({"_id": target_user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if actually following
    current_user_data = await db.users.find_one({"_id": current_user_id})
    if target_user_id not in current_user_data.get("following", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not following this user"
        )

    # Remove from following list
    await db.users.update_one(
        {"_id": current_user_id},
        {
            "$pull": {"following": target_user_id},
            "$inc": {"following_count": -1}
        }
    )

    # Remove from followers list
    await db.users.update_one(
        {"_id": target_user_id},
        {
            "$pull": {"followers": current_user_id},
            "$inc": {"followers_count": -1}
        }
    )

    # Get updated follower count
    updated_target = await db.users.find_one({"_id": target_user_id})

    return FollowResponse(
        success=True,
        message=f"You unfollowed {target_user.get('username', 'this user')}",
        is_following=False,
        followers_count=updated_target.get("followers_count", 0)
    )


@router.post("/users/{user_id}/follow")
async def toggle_follow_user(
    user_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Toggle follow/unfollow a user (simpler endpoint for frontend)
    """
    current_user_id = str(current_user.id)

    # Can't follow yourself
    if user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself"
        )

    # Check if target user exists
    target_user = await db.users.find_one({"_id": user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if already following
    current_user_data = await db.users.find_one({"_id": current_user_id})
    is_following = user_id in current_user_data.get("following", [])

    if is_following:
        # Unfollow
        await db.users.update_one(
            {"_id": current_user_id},
            {
                "$pull": {"following": user_id},
                "$inc": {"following_count": -1}
            }
        )
        await db.users.update_one(
            {"_id": user_id},
            {
                "$pull": {"followers": current_user_id},
                "$inc": {"followers_count": -1}
            }
        )
        action = "unfollowed"
        new_status = False
    else:
        # Follow
        await db.users.update_one(
            {"_id": current_user_id},
            {
                "$addToSet": {"following": user_id},
                "$inc": {"following_count": 1}
            }
        )
        await db.users.update_one(
            {"_id": user_id},
            {
                "$addToSet": {"followers": current_user_id},
                "$inc": {"followers_count": 1}
            }
        )
        action = "followed"
        new_status = True

        # Create activity for following a user
        await create_activity(
            db=db,
            user_id=current_user_id,
            activity_type=ActivityType.FOLLOWED_USER,
            title=f"{current_user.username} followed {target_user.get('username')}",
            description=f"followed {target_user.get('username')}",
            icon="👥",
            related_user_id=user_id
        )

    updated_target = await db.users.find_one({"_id": user_id})

    return {
        "success": True,
        "action": action,
        "is_following": new_status,
        "followers_count": updated_target.get("followers_count", 0)
    }


@router.get("/profile/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Get a user's public profile

    - Returns profile data if public or if user is followed
    - Shows social context (is_following, follows_you)
    """
    db = db_service.get_db()

    # Get target user
    target_user = await db.users.find_one({"_id": user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    current_user_id = str(current_user.id)

    # Check if profile is public or if current user follows them
    is_following = current_user_id in target_user.get("following", [])
    follows_you = user_id in current_user.following
    is_public = target_user.get("is_profile_public", True)
    is_own_profile = user_id == current_user_id

    # Private profile check
    if not is_public and not is_following and not is_own_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This profile is private"
        )

    # Build response
    return UserProfileResponse(
        id=user_id,
        username=target_user.get("username"),
        full_name=target_user.get("full_name"),
        bio=target_user.get("bio"),
        profile_picture=target_user.get("profile_picture"),
        education_level=target_user.get("education_level"),
        subjects=target_user.get("subjects", []),
        school=target_user.get("school"),
        is_teacher=target_user.get("is_teacher", False),
        is_verified=target_user.get("is_verified", False),
        followers_count=target_user.get("followers_count", 0),
        following_count=target_user.get("following_count", 0),
        total_points=target_user.get("total_points", 0),
        current_streak=target_user.get("current_streak", 0),
        level=target_user.get("level", 1),
        is_following=follows_you,
        follows_you=is_following,
        created_at=target_user.get("created_at", datetime.utcnow())
    )


@router.get("/followers/{user_id}", response_model=List[FollowListItem])
async def get_followers(
    user_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Get list of users who follow this user
    """
    # Get target user
    target_user = await db.users.find_one({"_id": user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    follower_ids = target_user.get("followers", [])

    if not follower_ids:
        return []

    # Get follower user data
    followers = []
    async for user in db.users.find({"_id": {"$in": follower_ids}}):
        followers.append(FollowListItem(
            id=str(user["_id"]),
            username=user.get("username"),
            full_name=user.get("full_name"),
            profile_picture=user.get("profile_picture"),
            bio=user.get("bio"),
            is_following=str(user["_id"]) in current_user.following,
            is_teacher=user.get("is_teacher", False),
            is_verified=user.get("is_verified", False)
        ))

    return followers


@router.get("/following/{user_id}", response_model=List[FollowListItem])
async def get_following(
    user_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Get list of users this user follows
    """
    # Get target user
    target_user = await db.users.find_one({"_id": user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    following_ids = target_user.get("following", [])

    if not following_ids:
        return []

    # Get following user data
    following = []
    async for user in db.users.find({"_id": {"$in": following_ids}}):
        following.append(FollowListItem(
            id=str(user["_id"]),
            username=user.get("username"),
            full_name=user.get("full_name"),
            profile_picture=user.get("profile_picture"),
            bio=user.get("bio"),
            is_following=str(user["_id"]) in current_user.following,
            is_teacher=user.get("is_teacher", False),
            is_verified=user.get("is_verified", False)
        ))

    return following


@router.get("/suggested-users", response_model=List[FollowListItem])
async def get_suggested_users(
    current_user: User = Depends(get_current_user_dependency),
    limit: int = 20
):
    """
    Get suggested users to follow

    Algorithm:
    1. Users who study same subjects
    2. Users from same school
    3. Users with high engagement (followers, points)
    4. Exclude already following
    """
    current_user_id = str(current_user.id)

    # Build suggestion query
    suggestions = []

    # Strategy 1: Same subjects
    if current_user.subjects:
        async for user in db.users.find({
            "_id": {"$ne": current_user_id, "$nin": current_user.following},
            "subjects": {"$in": current_user.subjects},
            "is_active": True
        }).limit(limit):
            suggestions.append(user)

    # Strategy 2: Same school
    if current_user.school and len(suggestions) < limit:
        async for user in db.users.find({
            "_id": {"$ne": current_user_id, "$nin": current_user.following},
            "school": current_user.school,
            "is_active": True
        }).limit(limit - len(suggestions)):
            if user not in suggestions:
                suggestions.append(user)

    # Strategy 3: Popular users (high followers, points)
    if len(suggestions) < limit:
        async for user in db.users.find({
            "_id": {"$ne": current_user_id, "$nin": current_user.following},
            "is_active": True
        }).sort("followers_count", -1).limit(limit - len(suggestions)):
            if user not in suggestions:
                suggestions.append(user)

    # Convert to response format
    result = []
    for user in suggestions[:limit]:
        result.append(FollowListItem(
            id=str(user["_id"]),
            username=user.get("username"),
            full_name=user.get("full_name"),
            profile_picture=user.get("profile_picture"),
            bio=user.get("bio"),
            is_following=False,  # By definition (we filtered them out)
            is_teacher=user.get("is_teacher", False),
            is_verified=user.get("is_verified", False)
        ))

    return result


@router.get("/search-users")
async def search_users(
    query: str,
    current_user: User = Depends(get_current_user_dependency),
    limit: int = 20
):
    """
    Search for users by username, full name, or school
    """
    if not query or len(query) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query must be at least 2 characters"
        )

    # Search in username, full_name, school
    search_regex = {"$regex": query, "$options": "i"}  # Case-insensitive

    results = []
    async for user in db.users.find({
        "$or": [
            {"username": search_regex},
            {"full_name": search_regex},
            {"school": search_regex}
        ],
        "is_active": True
    }).limit(limit):
        results.append(FollowListItem(
            id=str(user["_id"]),
            username=user.get("username"),
            full_name=user.get("full_name"),
            profile_picture=user.get("profile_picture"),
            bio=user.get("bio"),
            is_following=str(user["_id"]) in current_user.following,
            is_teacher=user.get("is_teacher", False),
            is_verified=user.get("is_verified", False)
        ))

    return results


# ============== DECK POSTING ENDPOINTS ==============

@router.post("/decks", response_model=DeckPost)
async def create_deck(
    deck_data: DeckCreate,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Create a new deck

    - Start as private by default
    - Can publish later by changing visibility
    """
    # Create deck document
    deck = Deck(
        user_id=str(current_user.id),
        title=deck_data.title,
        description=deck_data.description,
        subject=deck_data.subject,
        topic=deck_data.topic,
        education_level=deck_data.education_level,
        course_code=deck_data.course_code,
        tags=deck_data.tags,
        visibility=deck_data.visibility,
        card_ids=deck_data.card_ids,
        card_count=len(deck_data.card_ids),
        published_at=datetime.utcnow() if deck_data.visibility != DeckVisibility.PRIVATE else None
    )

    # Insert into database
    result = await db.decks.insert_one(deck.dict(exclude={"id"}))
    deck.id = str(result.inserted_id)

    # Build response with author info
    return DeckPost(
        id=deck.id,
        user_id=deck.user_id,
        title=deck.title,
        description=deck.description,
        cover_image=deck.cover_image,
        subject=deck.subject,
        topic=deck.topic,
        education_level=deck.education_level,
        course_code=deck.course_code,
        tags=deck.tags,
        card_count=deck.card_count,
        visibility=deck.visibility,
        is_featured=deck.is_featured,
        likes=0,
        saves=0,
        views=0,
        comments_count=0,
        author_username=current_user.username,
        author_full_name=current_user.full_name,
        author_profile_picture=current_user.profile_picture,
        author_is_teacher=current_user.is_teacher,
        author_is_verified=current_user.is_verified,
        is_liked=False,
        is_saved=False,
        created_at=deck.created_at,
        published_at=deck.published_at
    )


@router.put("/decks/{deck_id}", response_model=DeckPost)
async def update_deck(
    deck_id: str,
    deck_update: DeckUpdate,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Update a deck

    - Only owner can update
    - Changing visibility to public sets published_at
    """
    # Check ownership
    existing_deck = await db.decks.find_one({"_id": deck_id})
    if not existing_deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    if existing_deck["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own decks"
        )

    # Build update data
    update_data = deck_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    # If changing to public, set published_at
    if (deck_update.visibility and
        deck_update.visibility != DeckVisibility.PRIVATE and
        not existing_deck.get("published_at")):
        update_data["published_at"] = datetime.utcnow()

    # Update card count if card_ids changed
    if deck_update.card_ids is not None:
        update_data["card_count"] = len(deck_update.card_ids)

    # Update database
    await db.decks.update_one(
        {"_id": deck_id},
        {"$set": update_data}
    )

    # Get updated deck
    updated_deck = await db.decks.find_one({"_id": deck_id})

    # Build response
    return DeckPost(
        id=deck_id,
        user_id=updated_deck["user_id"],
        title=updated_deck["title"],
        description=updated_deck.get("description"),
        cover_image=updated_deck.get("cover_image"),
        subject=updated_deck["subject"],
        topic=updated_deck.get("topic"),
        education_level=updated_deck.get("education_level"),
        course_code=updated_deck.get("course_code"),
        tags=updated_deck.get("tags", []),
        card_count=updated_deck.get("card_count", 0),
        visibility=updated_deck["visibility"],
        is_featured=updated_deck.get("is_featured", False),
        likes=updated_deck.get("likes", 0),
        saves=updated_deck.get("saves", 0),
        views=updated_deck.get("views", 0),
        comments_count=updated_deck.get("comments_count", 0),
        author_username=current_user.username,
        author_full_name=current_user.full_name,
        author_profile_picture=current_user.profile_picture,
        author_is_teacher=current_user.is_teacher,
        author_is_verified=current_user.is_verified,
        is_liked=False,  # TODO: Check if current user liked this
        is_saved=False,  # TODO: Check if current user saved this
        created_at=updated_deck["created_at"],
        published_at=updated_deck.get("published_at")
    )


@router.get("/decks/{deck_id}", response_model=DeckPost)
async def get_deck(
    deck_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Get a single deck by ID

    - Increments view count
    - Checks visibility permissions
    """
    deck = await db.decks.find_one({"_id": deck_id})
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    # Check visibility permissions
    current_user_id = str(current_user.id)
    is_owner = deck["user_id"] == current_user_id
    visibility = deck["visibility"]

    # Private: Only owner
    if visibility == DeckVisibility.PRIVATE and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This deck is private"
        )

    # Friends only: Must be following
    if visibility == DeckVisibility.FRIENDS_ONLY and not is_owner:
        author = await db.users.find_one({"_id": deck["user_id"]})
        if current_user_id not in author.get("followers", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This deck is only visible to followers"
            )

    # Classmates only: Same school/course
    if visibility == DeckVisibility.CLASSMATES_ONLY and not is_owner:
        author = await db.users.find_one({"_id": deck["user_id"]})
        deck_course = deck.get("course_code")
        if deck_course and deck_course not in current_user.courses:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This deck is only visible to classmates"
            )

    # Subject community: Must study same subject
    if visibility == DeckVisibility.SUBJECT_COMMUNITY and not is_owner:
        if deck["subject"] not in current_user.subjects:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This deck is only visible to {deck['subject']} students"
            )

    # Increment view count (only if not owner)
    if not is_owner:
        await db.decks.update_one(
            {"_id": deck_id},
            {"$inc": {"views": 1}}
        )
        deck["views"] = deck.get("views", 0) + 1

    # Get author info
    author = await db.users.find_one({"_id": deck["user_id"]})

    # Build response
    return DeckPost(
        id=deck_id,
        user_id=deck["user_id"],
        title=deck["title"],
        description=deck.get("description"),
        cover_image=deck.get("cover_image"),
        subject=deck["subject"],
        topic=deck.get("topic"),
        education_level=deck.get("education_level"),
        course_code=deck.get("course_code"),
        tags=deck.get("tags", []),
        card_count=deck.get("card_count", 0),
        visibility=deck["visibility"],
        is_featured=deck.get("is_featured", False),
        likes=deck.get("likes", 0),
        saves=deck.get("saves", 0),
        views=deck.get("views", 0),
        comments_count=deck.get("comments_count", 0),
        author_username=author.get("username"),
        author_full_name=author.get("full_name"),
        author_profile_picture=author.get("profile_picture"),
        author_is_teacher=author.get("is_teacher", False),
        author_is_verified=author.get("is_verified", False),
        is_liked=False,  # TODO: Check if current user liked this
        is_saved=False,  # TODO: Check if current user saved this
        created_at=deck["created_at"],
        published_at=deck.get("published_at")
    )


@router.delete("/decks/{deck_id}")
async def delete_deck(
    deck_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Delete a deck

    - Only owner can delete
    """
    deck = await db.decks.find_one({"_id": deck_id})
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    if deck["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own decks"
        )

    await db.decks.delete_one({"_id": deck_id})

    return {"success": True, "message": "Deck deleted"}


@router.post("/decks/{deck_id}/like")
async def like_deck(
    deck_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Like/unlike a deck
    """
    deck = await db.decks.find_one({"_id": deck_id})
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    # Check if already liked
    # TODO: Implement likes collection for tracking who liked what

    # For now, just increment
    await db.decks.update_one(
        {"_id": deck_id},
        {"$inc": {"likes": 1}}
    )

    return {"success": True, "liked": True}


@router.post("/decks/{deck_id}/save")
async def save_deck(
    deck_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Save/fork a deck to your library

    - Creates a copy of the deck for current user
    - Increments save count on original
    """
    original_deck = await db.decks.find_one({"_id": deck_id})
    if not original_deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    # Check if already saved
    existing_save = await db.decks.find_one({
        "user_id": str(current_user.id),
        "title": f"{original_deck['title']} (saved)",
        "subject": original_deck["subject"]
    })

    if existing_save:
        return {"success": True, "message": "Already saved", "deck_id": str(existing_save["_id"])}

    # Create copy for current user
    saved_deck = Deck(
        user_id=str(current_user.id),
        title=f"{original_deck['title']} (saved)",
        description=f"Saved from {original_deck.get('author_username', 'someone')}",
        subject=original_deck["subject"],
        topic=original_deck.get("topic"),
        education_level=original_deck.get("education_level"),
        course_code=original_deck.get("course_code"),
        tags=original_deck.get("tags", []),
        card_ids=original_deck.get("card_ids", []),
        card_count=original_deck.get("card_count", 0),
        visibility=DeckVisibility.PRIVATE  # Saved decks are private by default
    )

    result = await db.decks.insert_one(saved_deck.dict(exclude={"id"}))

    # Increment save count on original
    await db.decks.update_one(
        {"_id": deck_id},
        {"$inc": {"saves": 1}}
    )

    return {
        "success": True,
        "message": "Deck saved to your library",
        "deck_id": str(result.inserted_id)
    }


# ============== PERSONALIZED FEED ==============

@router.get("/feed", response_model=List[DeckPost])
async def get_personalized_feed(
    current_user: User = Depends(get_current_user_dependency),
    limit: int = 50,
    offset: int = 0
):
    """
    Get personalized feed of deck posts

    Algorithm:
    - 60% from people you follow
    - 30% from your subjects
    - 10% trending

    Returns mixed, ranked feed based on engagement and recency
    """
    # Initialize feed algorithm
    feed_algo = FeedAlgorithm(db)

    # Generate feed
    feed_decks = await feed_algo.generate_feed(
        user_id=str(current_user.id),
        user_subjects=current_user.subjects,
        user_following=current_user.following,
        user_education_level=current_user.education_level,
        user_school=current_user.school,
        user_courses=current_user.courses,
        limit=limit,
        offset=offset
    )

    # Enrich with author data
    enriched_feed = []
    for deck in feed_decks:
        enriched = await enrich_deck_with_author(db, deck, str(current_user.id))
        enriched_feed.append(DeckPost(**enriched))

    return enriched_feed


@router.get("/feed/insights")
async def get_feed_insights(
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Get insights about user's feed composition

    - Shows how feed is personalized
    - Helps users understand algorithm
    """
    # Count decks from different sources
    following_count = 0
    if current_user.following:
        following_count = await db.decks.count_documents({
            "user_id": {"$in": current_user.following},
            "visibility": {"$ne": "private"}
        })

    subjects_count = 0
    if current_user.subjects:
        subjects_count = await db.decks.count_documents({
            "subject": {"$in": current_user.subjects},
            "visibility": {"$in": ["public", "subject_community"]}
        })

    trending_count = await db.decks.count_documents({
        "visibility": "public",
        "published_at": {"$gte": datetime.utcnow() - timedelta(days=7)}
    })

    return {
        "feed_composition": {
            "following": {
                "percentage": 60,
                "available_decks": following_count,
                "description": f"Decks from {len(current_user.following)} people you follow"
            },
            "subjects": {
                "percentage": 30,
                "available_decks": subjects_count,
                "description": f"Decks about {', '.join(current_user.subjects[:3])}"
            },
            "trending": {
                "percentage": 10,
                "available_decks": trending_count,
                "description": "Popular decks from the past week"
            }
        },
        "personalization_tips": [
            "Follow more people to see diverse content" if len(current_user.following) < 10 else "Great! You follow enough people for personalized feed",
            "Add more subjects to discover relevant decks" if len(current_user.subjects) < 3 else "Perfect subject selection for personalized recommendations",
            "Complete your profile for better suggestions" if not current_user.education_level else "Profile complete - getting best recommendations"
        ]
    }


@router.get("/feed/explore/{subject}")
async def explore_subject_feed(
    subject: str,
    current_user: User = Depends(get_current_user_dependency),
    limit: int = 50
):
    """
    Explore decks for a specific subject

    - Shows top decks for subject
    - Filtered by education level
    - Ranked by engagement
    """
    query = {
        "subject": subject,
        "visibility": {"$in": ["public", "subject_community"]}
    }

    # Optionally filter by education level
    if current_user.education_level:
        query["$or"] = [
            {"education_level": current_user.education_level},
            {"education_level": None}
        ]

    decks = []
    async for deck in db.decks.find(query).sort("likes", -1).limit(limit):
        enriched = await enrich_deck_with_author(db, deck, str(current_user.id))
        decks.append(DeckPost(**enriched))

    return decks
