"""
Reels API - TikTok-style educational video shorts
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import json

from app.services.database_service import db_service
from app.api.auth import get_current_user_dependency
from app.models.user import User

router = APIRouter(prefix="/api/reels", tags=["reels"])


# ============== REQUEST/RESPONSE MODELS ==============

class ReelCreate(BaseModel):
    """Create a new reel"""
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    hashtags: Optional[List[str]] = None


class ReelResponse(BaseModel):
    """Reel data"""
    id: str
    video_url: str
    thumbnail_url: Optional[str]
    title: str
    description: Optional[str]
    creator_id: str
    creator_username: str
    creator_profile_picture: Optional[str]
    creator_verified: bool = False
    creator_badge_type: Optional[str] = None
    likes: int
    comments_count: int
    shares_count: int
    views: int
    created_at: str
    liked_by_current_user: bool = False
    following_creator: bool = False
    category: Optional[str]
    hashtags: Optional[List[str]]


# ============== ENDPOINTS ==============

@router.get("/feed", response_model=List[ReelResponse])
async def get_reels_feed(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Get personalized "For You" feed of reels
    Algorithm considers:
    - User interests (subjects, education level)
    - Engagement history
    - Creator diversity
    - Trending content
    """
    db = db_service.get_db()
    try:
        # Get user interests
        user_subjects = current_user.subjects if hasattr(current_user, 'subjects') else []
        education_level = current_user.education_level if hasattr(current_user, 'education_level') else None

        # Query reels with personalization
        pipeline = [
            {
                "$addFields": {
                    "creator_id_obj": {"$toObjectId": "$creator_id"}
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "creator_id_obj",
                    "foreignField": "_id",
                    "as": "creator"
                }
            },
            {"$unwind": {"path": "$creator", "preserveNullAndEmptyArrays": False}},
            {
                "$lookup": {
                    "from": "reel_likes",
                    "let": {"reel_id": "$_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$reel_id", "$$reel_id"]},
                                        {"$eq": ["$user_id", current_user.id]}
                                    ]
                                }
                            }
                        }
                    ],
                    "as": "user_like"
                }
            },
            {
                "$lookup": {
                    "from": "follows",
                    "let": {"creator_id": "$creator_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$following_id", "$$creator_id"]},
                                        {"$eq": ["$follower_id", current_user.id]}
                                    ]
                                }
                            }
                        }
                    ],
                    "as": "follow_status"
                }
            },
            {
                "$addFields": {
                    "liked_by_current_user": {"$gt": [{"$size": "$user_like"}, 0]},
                    "following_creator": {"$gt": [{"$size": "$follow_status"}, 0]},
                    # Personalization score
                    "relevance_score": {
                        "$add": [
                            # Boost if category matches user interests
                            {
                                "$cond": [
                                    {"$in": ["$category", user_subjects if user_subjects else []]},
                                    10,
                                    0
                                ]
                            },
                            # Engagement score (likes + comments + shares)
                            {"$divide": [{"$add": ["$likes", "$comments_count", "$shares_count"]}, 10]},
                            # Recency boost (newer content)
                            {
                                "$divide": [
                                    {"$subtract": [datetime.utcnow(), "$created_at"]},
                                    -86400000  # Divide by milliseconds in a day, negative for recency
                                ]
                            }
                        ]
                    }
                }
            },
            {"$sort": {"relevance_score": -1, "created_at": -1}},
            {"$skip": offset},
            {"$limit": limit},
            {
                "$project": {
                    "id": {"$toString": "$_id"},
                    "video_url": 1,
                    "thumbnail_url": 1,
                    "title": 1,
                    "description": 1,
                    "creator_id": {"$toString": "$creator_id"},
                    "creator_username": "$creator.username",
                    "creator_profile_picture": "$creator.profile_picture",
                    "creator_verified": "$creator.is_verified",
                    "creator_badge_type": {
                        "$cond": [
                            "$creator.is_teacher",
                            "teacher",
                            "student"
                        ]
                    },
                    "likes": 1,
                    "comments_count": 1,
                    "shares_count": 1,
                    "views": 1,
                    "created_at": {"$toString": "$created_at"},
                    "liked_by_current_user": 1,
                    "following_creator": 1,
                    "category": 1,
                    "hashtags": 1
                }
            }
        ]

        reels = await db["reels"].aggregate(pipeline).to_list(length=limit)

        # Increment view counts
        reel_ids = [r["id"] for r in reels]
        if reel_ids:
            await db["reels"].update_many(
                {"_id": {"$in": reel_ids}},
                {"$inc": {"views": 1}}
            )

        return reels

    except Exception as e:
        print(f"Error loading reels feed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load reels feed: {str(e)}"
        )


@router.get("/following", response_model=List[ReelResponse])
async def get_following_reels(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user_dependency)
):
    """Get reels from creators the user follows"""
    db = db_service.get_db()
    try:
        # Get list of users the current user follows
        follows = await db["follows"].find(
            {"follower_id": current_user.id}
        ).to_list(length=None)

        following_ids = [f["following_id"] for f in follows]

        if not following_ids:
            return []

        # Query reels from followed creators
        pipeline = [
            {"$match": {"creator_id": {"$in": following_ids}}},
            {
                "$addFields": {
                    "creator_id_obj": {"$toObjectId": "$creator_id"}
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "creator_id_obj",
                    "foreignField": "_id",
                    "as": "creator"
                }
            },
            {"$unwind": {"path": "$creator", "preserveNullAndEmptyArrays": False}},
            {
                "$lookup": {
                    "from": "reel_likes",
                    "let": {"reel_id": "$_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$reel_id", "$$reel_id"]},
                                        {"$eq": ["$user_id", current_user.id]}
                                    ]
                                }
                            }
                        }
                    ],
                    "as": "user_like"
                }
            },
            {
                "$addFields": {
                    "liked_by_current_user": {"$gt": [{"$size": "$user_like"}, 0]},
                    "following_creator": True
                }
            },
            {"$sort": {"created_at": -1}},
            {"$skip": offset},
            {"$limit": limit},
            {
                "$project": {
                    "id": {"$toString": "$_id"},
                    "video_url": 1,
                    "thumbnail_url": 1,
                    "title": 1,
                    "description": 1,
                    "creator_id": {"$toString": "$creator_id"},
                    "creator_username": "$creator.username",
                    "creator_profile_picture": "$creator.profile_picture",
                    "creator_verified": "$creator.is_verified",
                    "creator_badge_type": {
                        "$cond": [
                            "$creator.is_teacher",
                            "teacher",
                            "student"
                        ]
                    },
                    "likes": 1,
                    "comments_count": 1,
                    "shares_count": 1,
                    "views": 1,
                    "created_at": {"$toString": "$created_at"},
                    "liked_by_current_user": 1,
                    "following_creator": 1,
                    "category": 1,
                    "hashtags": 1
                }
            }
        ]

        reels = await db["reels"].aggregate(pipeline).to_list(length=limit)

        # Increment view counts
        reel_ids = [r["id"] for r in reels]
        if reel_ids:
            await db["reels"].update_many(
                {"_id": {"$in": reel_ids}},
                {"$inc": {"views": 1}}
            )

        return reels

    except Exception as e:
        print(f"Error loading following reels: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load following reels: {str(e)}"
        )


@router.post("/upload")
async def upload_reel(
    video: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    hashtags: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Upload a new reel
    TODO: Implement actual video storage (S3, Cloudinary, etc.)
    For now, this is a placeholder that simulates upload
    """
    db = db_service.get_db()
    try:
        # Parse hashtags
        hashtag_list = None
        if hashtags:
            try:
                hashtag_list = json.loads(hashtags)
            except:
                hashtag_list = [h.strip() for h in hashtags.split('#') if h.strip()]

        # In production, upload video to cloud storage and get URL
        # For now, use a placeholder
        video_url = f"https://storage.ariel.com/reels/{current_user.id}/{datetime.utcnow().timestamp()}.mp4"
        thumbnail_url = f"https://storage.ariel.com/thumbnails/{current_user.id}/{datetime.utcnow().timestamp()}.jpg"

        # Create reel document
        reel_doc = {
            "video_url": video_url,
            "thumbnail_url": thumbnail_url,
            "title": title,
            "description": description,
            "category": category,
            "hashtags": hashtag_list,
            "creator_id": current_user.id,
            "likes": 0,
            "comments_count": 0,
            "shares_count": 0,
            "views": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await db["reels"].insert_one(reel_doc)

        # Create activity for followers
        await db["activities"].insert_one({
            "user_id": current_user.id,
            "username": current_user.username,
            "profile_picture": getattr(current_user, 'profile_picture', None),
            "activity_type": "reel_posted",
            "metadata": {
                "reel_id": str(result.inserted_id),
                "title": title,
                "category": category
            },
            "created_at": datetime.utcnow(),
            "likes": 0,
            "liked_by": []
        })

        return {
            "success": True,
            "message": "Reel uploaded successfully",
            "reel_id": str(result.inserted_id),
            "video_url": video_url
        }

    except Exception as e:
        print(f"Error uploading reel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload reel: {str(e)}"
        )


@router.post("/{reel_id}/like")
async def like_reel(
    reel_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Like or unlike a reel"""
    db = db_service.get_db()
    try:
        from bson import ObjectId

        # Check if already liked
        existing_like = await db["reel_likes"].find_one({
            "reel_id": reel_id,
            "user_id": current_user.id
        })

        if existing_like:
            # Unlike
            await db["reel_likes"].delete_one({"_id": existing_like["_id"]})
            await db["reels"].update_one(
                {"_id": ObjectId(reel_id)},
                {"$inc": {"likes": -1}}
            )
            return {"success": True, "liked": False}
        else:
            # Like
            await db["reel_likes"].insert_one({
                "reel_id": reel_id,
                "user_id": current_user.id,
                "created_at": datetime.utcnow()
            })
            await db["reels"].update_one(
                {"_id": ObjectId(reel_id)},
                {"$inc": {"likes": 1}}
            )

            # Create notification for reel creator
            reel = await db["reels"].find_one({"_id": ObjectId(reel_id)})
            if reel and reel["creator_id"] != current_user.id:
                await db["notifications"].insert_one({
                    "user_id": reel["creator_id"],
                    "type": "like",
                    "from_user_id": current_user.id,
                    "username": current_user.username,
                    "profile_picture": getattr(current_user, 'profile_picture', None),
                    "message": "liked your reel",
                    "metadata": {
                        "reel_id": reel_id,
                        "reel_title": reel.get("title")
                    },
                    "created_at": datetime.utcnow(),
                    "read": False
                })

            return {"success": True, "liked": True}

    except Exception as e:
        print(f"Error liking reel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to like reel: {str(e)}"
        )


@router.get("/{reel_id}", response_model=ReelResponse)
async def get_reel(
    reel_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Get a specific reel by ID"""
    db = db_service.get_db()
    try:
        from bson import ObjectId

        pipeline = [
            {"$match": {"_id": ObjectId(reel_id)}},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "creator_id",
                    "foreignField": "_id",
                    "as": "creator"
                }
            },
            {"$unwind": "$creator"},
            {
                "$lookup": {
                    "from": "reel_likes",
                    "let": {"reel_id": "$_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$reel_id", "$$reel_id"]},
                                        {"$eq": ["$user_id", current_user.id]}
                                    ]
                                }
                            }
                        }
                    ],
                    "as": "user_like"
                }
            },
            {
                "$lookup": {
                    "from": "follows",
                    "let": {"creator_id": "$creator_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$following_id", "$$creator_id"]},
                                        {"$eq": ["$follower_id", current_user.id]}
                                    ]
                                }
                            }
                        }
                    ],
                    "as": "follow_status"
                }
            },
            {
                "$addFields": {
                    "liked_by_current_user": {"$gt": [{"$size": "$user_like"}, 0]},
                    "following_creator": {"$gt": [{"$size": "$follow_status"}, 0]}
                }
            },
            {
                "$project": {
                    "id": {"$toString": "$_id"},
                    "video_url": 1,
                    "thumbnail_url": 1,
                    "title": 1,
                    "description": 1,
                    "creator_id": {"$toString": "$creator_id"},
                    "creator_username": "$creator.username",
                    "creator_profile_picture": "$creator.profile_picture",
                    "creator_verified": "$creator.is_verified",
                    "creator_badge_type": {
                        "$cond": [
                            "$creator.is_teacher",
                            "teacher",
                            "student"
                        ]
                    },
                    "likes": 1,
                    "comments_count": 1,
                    "shares_count": 1,
                    "views": 1,
                    "created_at": {"$toString": "$created_at"},
                    "liked_by_current_user": 1,
                    "following_creator": 1,
                    "category": 1,
                    "hashtags": 1
                }
            }
        ]

        reels = await db["reels"].aggregate(pipeline).to_list(length=1)

        if not reels:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reel not found"
            )

        # Increment view count
        await db["reels"].update_one(
            {"_id": ObjectId(reel_id)},
            {"$inc": {"views": 1}}
        )

        return reels[0]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting reel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get reel: {str(e)}"
        )
