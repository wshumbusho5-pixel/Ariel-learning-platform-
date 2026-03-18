"""
Reels API - TikTok-style educational video shorts
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import json
import uuid
import cloudinary
import cloudinary.uploader

from app.services.database_service import db_service
from app.api.auth import get_current_user_dependency
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

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
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    title: str = ""
    description: Optional[str] = None
    creator_id: str = ""
    creator_username: str = ""
    creator_profile_picture: Optional[str] = None
    creator_verified: bool = False
    creator_badge_type: Optional[str] = None
    likes: int = 0
    comments_count: int = 0
    shares_count: int = 0
    views: int = 0
    created_at: str = ""
    liked_by_current_user: bool = False
    following_creator: bool = False
    category: Optional[str] = None
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
            # Only return reels that have an actual video URL
            {"$match": {"video_url": {"$exists": True, "$ne": None, "$ne": ""}}},
            {
                "$addFields": {
                    "creator_id_obj": {
                        "$cond": {
                            "if": {"$regexMatch": {"input": "$creator_id", "regex": "^[0-9a-fA-F]{24}$"}},
                            "then": {"$toObjectId": "$creator_id"},
                            "else": None
                        }
                    }
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
            {"$unwind": {"path": "$creator", "preserveNullAndEmptyArrays": True}},
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
                    "title": {"$ifNull": ["$title", ""]},
                    "description": 1,
                    "creator_id": {"$ifNull": ["$creator_id", ""]},
                    "creator_username": {"$ifNull": ["$creator.username", "unknown"]},
                    "creator_profile_picture": "$creator.profile_picture",
                    "creator_verified": {"$ifNull": ["$creator.is_verified", False]},
                    "creator_badge_type": {
                        "$cond": [
                            "$creator.is_teacher",
                            "teacher",
                            "student"
                        ]
                    },
                    "likes": {"$ifNull": ["$likes", 0]},
                    "comments_count": {"$ifNull": ["$comments_count", 0]},
                    "shares_count": {"$ifNull": ["$shares_count", 0]},
                    "views": {"$ifNull": ["$views", 0]},
                    "created_at": {"$toString": "$created_at"},
                    "liked_by_current_user": 1,
                    "following_creator": 1,
                    "category": 1,
                    "hashtags": 1
                }
            }
        ]

        reels = await db["reels"].aggregate(pipeline).to_list(length=limit)

        # Increment view counts (ObjectId required for _id matching)
        from bson import ObjectId as BsonObjectId
        reel_oids = []
        for r in reels:
            try:
                reel_oids.append(BsonObjectId(r["id"]))
            except Exception:
                pass
        if reel_oids:
            await db["reels"].update_many(
                {"_id": {"$in": reel_oids}},
                {"$inc": {"views": 1}}
            )

        return reels

    except Exception as e:
        logger.error(f"Error loading reels feed: {e}")
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
            {"$match": {"creator_id": {"$in": following_ids}, "video_url": {"$exists": True, "$ne": None, "$ne": ""}}},
            {
                "$addFields": {
                    "creator_id_obj": {
                        "$cond": {
                            "if": {"$regexMatch": {"input": "$creator_id", "regex": "^[0-9a-fA-F]{24}$"}},
                            "then": {"$toObjectId": "$creator_id"},
                            "else": None
                        }
                    }
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
            {"$unwind": {"path": "$creator", "preserveNullAndEmptyArrays": True}},
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
                    "title": {"$ifNull": ["$title", ""]},
                    "description": 1,
                    "creator_id": {"$ifNull": ["$creator_id", ""]},
                    "creator_username": {"$ifNull": ["$creator.username", "unknown"]},
                    "creator_profile_picture": "$creator.profile_picture",
                    "creator_verified": {"$ifNull": ["$creator.is_verified", False]},
                    "creator_badge_type": {
                        "$cond": [
                            "$creator.is_teacher",
                            "teacher",
                            "student"
                        ]
                    },
                    "likes": {"$ifNull": ["$likes", 0]},
                    "comments_count": {"$ifNull": ["$comments_count", 0]},
                    "shares_count": {"$ifNull": ["$shares_count", 0]},
                    "views": {"$ifNull": ["$views", 0]},
                    "created_at": {"$toString": "$created_at"},
                    "liked_by_current_user": 1,
                    "following_creator": 1,
                    "category": 1,
                    "hashtags": 1
                }
            }
        ]

        reels = await db["reels"].aggregate(pipeline).to_list(length=limit)

        return reels

    except Exception as e:
        logger.error(f"Error loading following reels: {e}")
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
    Upload a new reel with actual video storage
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

        # Upload video to Cloudinary
        content = await video.read()
        public_id = f"reels/{uuid.uuid4()}"
        result = cloudinary.uploader.upload(
            content,
            public_id=public_id,
            resource_type="video",
            overwrite=True,
        )
        video_url = result["secure_url"]

        # Cloudinary auto-generates a thumbnail from the first frame
        thumbnail_url = (
            result["secure_url"]
            .replace("/video/upload/", "/video/upload/so_0,f_jpg/")
            .rsplit(".", 1)[0] + ".jpg"
        )

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
        logger.error(f"Error uploading reel: {e}")
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
        logger.error(f"Error liking reel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to like reel: {str(e)}"
        )


@router.post("/{reel_id}/save")
async def save_reel(
    reel_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Save or unsave a reel"""
    db = db_service.get_db()
    try:
        existing = await db["reel_saves"].find_one({
            "reel_id": reel_id,
            "user_id": current_user.id
        })
        if existing:
            await db["reel_saves"].delete_one({"_id": existing["_id"]})
            return {"success": True, "saved": False}
        else:
            await db["reel_saves"].insert_one({
                "reel_id": reel_id,
                "user_id": current_user.id,
                "created_at": datetime.utcnow()
            })
            return {"success": True, "saved": True}
    except Exception as e:
        logger.error(f"Error saving reel: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save reel: {str(e)}")


@router.get("/my-reels", response_model=List[ReelResponse])
async def get_my_reels(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user_dependency)
):
    """Get the current user's own uploaded reels"""
    db = db_service.get_db()
    try:
        pipeline = [
            {"$match": {"creator_id": current_user.id}},
            {"$sort": {"created_at": -1}},
            {"$skip": offset},
            {"$limit": limit},
            {
                "$project": {
                    "id": {"$toString": "$_id"},
                    "video_url": 1,
                    "thumbnail_url": 1,
                    "title": {"$ifNull": ["$title", ""]},
                    "description": 1,
                    "creator_id": {"$ifNull": ["$creator_id", ""]},
                    "creator_username": current_user.username,
                    "creator_profile_picture": getattr(current_user, 'profile_picture', None),
                    "creator_verified": False,
                    "creator_badge_type": "student",
                    "likes": {"$ifNull": ["$likes", 0]},
                    "comments_count": {"$ifNull": ["$comments_count", 0]},
                    "shares_count": {"$ifNull": ["$shares_count", 0]},
                    "views": {"$ifNull": ["$views", 0]},
                    "created_at": {"$toString": "$created_at"},
                    "liked_by_current_user": {"$literal": False},
                    "following_creator": {"$literal": False},
                    "category": 1,
                    "hashtags": 1
                }
            }
        ]

        reels = await db["reels"].aggregate(pipeline).to_list(length=limit)
        return reels
    except Exception as e:
        logger.error(f"Error loading my reels: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load your reels: {str(e)}")


@router.get("/saved", response_model=List[ReelResponse])
async def get_saved_reels(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user_dependency)
):
    """Get reels the current user has saved to their deck"""
    db = db_service.get_db()
    try:
        from bson import ObjectId
        pipeline = [
            {"$match": {"user_id": current_user.id}},
            {"$sort": {"created_at": -1}},
            {"$skip": offset},
            {"$limit": limit},
            # Convert reel_id string to ObjectId for lookup
            {"$addFields": {"reel_id_obj": {"$toObjectId": "$reel_id"}}},
            # Join reel data
            {"$lookup": {
                "from": "reels",
                "localField": "reel_id_obj",
                "foreignField": "_id",
                "as": "reel"
            }},
            {"$unwind": "$reel"},
            # Join creator data
            {"$addFields": {"creator_id_obj": {"$toObjectId": "$reel.creator_id"}}},
            {"$lookup": {
                "from": "users",
                "localField": "creator_id_obj",
                "foreignField": "_id",
                "as": "creator"
            }},
            {"$unwind": {"path": "$creator", "preserveNullAndEmptyArrays": True}},
            {"$project": {
                "id": {"$toString": "$reel._id"},
                "video_url": "$reel.video_url",
                "thumbnail_url": "$reel.thumbnail_url",
                "title": "$reel.title",
                "description": "$reel.description",
                "creator_id": "$reel.creator_id",
                "creator_username": "$creator.username",
                "creator_profile_picture": "$creator.profile_picture",
                "creator_verified": {"$ifNull": ["$creator.is_verified", False]},
                "creator_badge_type": {"$cond": ["$creator.is_teacher", "teacher", "student"]},
                "likes": {"$ifNull": ["$reel.likes", 0]},
                "comments_count": {"$ifNull": ["$reel.comments_count", 0]},
                "shares_count": {"$ifNull": ["$reel.shares_count", 0]},
                "views": {"$ifNull": ["$reel.views", 0]},
                "created_at": {"$toString": "$reel.created_at"},
                "liked_by_current_user": {"$literal": False},
                "following_creator": {"$literal": False},
                "category": "$reel.category",
                "hashtags": "$reel.hashtags",
            }}
        ]
        reels = await db["reel_saves"].aggregate(pipeline).to_list(length=limit)
        return reels
    except Exception as e:
        logger.error(f"Error loading saved reels: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load saved reels: {str(e)}")


@router.delete("/{reel_id}")
async def delete_reel(
    reel_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Delete a reel the current user uploaded"""
    db = db_service.get_db()
    try:
        from bson import ObjectId
        reel = await db["reels"].find_one({"_id": ObjectId(reel_id)})
        if not reel:
            raise HTTPException(status_code=404, detail="Reel not found")
        if str(reel["creator_id"]) != current_user.id:
            raise HTTPException(status_code=403, detail="You can only delete your own reels")

        # Remove from Cloudinary if URL present
        try:
            video_url = reel.get("video_url", "")
            if "cloudinary" in video_url:
                # Extract public_id from Cloudinary URL
                # URL pattern: .../video/upload/v.../reels/uuid.ext
                parts = video_url.split("/upload/")
                if len(parts) == 2:
                    public_id = parts[1].rsplit(".", 1)[0]
                    # Strip version prefix (v1234567/)
                    if public_id.startswith("v") and "/" in public_id:
                        public_id = public_id.split("/", 1)[1]
                    cloudinary.uploader.destroy(public_id, resource_type="video")
        except Exception as e:
            logger.warning(f"Could not delete from Cloudinary: {e}")

        await db["reels"].delete_one({"_id": ObjectId(reel_id)})
        await db["reel_likes"].delete_many({"reel_id": ObjectId(reel_id)})
        await db["reel_saves"].delete_many({"reel_id": reel_id})

        return {"success": True, "message": "Clip deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting reel: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete reel: {str(e)}")


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
        logger.error(f"Error getting reel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get reel: {str(e)}"
        )
