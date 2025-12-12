"""
LiveStream API - Live streaming functionality
"""
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from typing import List, Optional
from datetime import datetime
import secrets
import json
from bson import ObjectId

from app.services.database_service import db_service
from app.api.auth import get_current_user_dependency
from app.models.user import User
from app.models.livestream import (
    LiveStream, LiveStreamCreate, LiveStreamUpdate, LiveStreamWithStreamer,
    StreamStatus, StreamComment, StreamReaction
)
from app.models.activity import ActivityType
from app.api.activity_feed import create_activity

router = APIRouter(prefix="/api/livestream", tags=["livestream"])


# WebSocket connection manager for real-time features
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, List[WebSocket]] = {}

    async def connect(self, stream_id: str, websocket: WebSocket):
        await websocket.accept()
        if stream_id not in self.active_connections:
            self.active_connections[stream_id] = []
        self.active_connections[stream_id].append(websocket)

    def disconnect(self, stream_id: str, websocket: WebSocket):
        if stream_id in self.active_connections:
            self.active_connections[stream_id].remove(websocket)
            if not self.active_connections[stream_id]:
                del self.active_connections[stream_id]

    async def broadcast(self, stream_id: str, message: dict):
        if stream_id in self.active_connections:
            for connection in self.active_connections[stream_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

    def get_viewer_count(self, stream_id: str) -> int:
        return len(self.active_connections.get(stream_id, []))


manager = ConnectionManager()


@router.post("/create", response_model=LiveStream)
async def create_stream(
    stream_data: LiveStreamCreate,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    Create/Schedule a new live stream
    """
    db = db_service.get_db()

    # Generate stream key for broadcaster
    stream_key = f"sk_{secrets.token_urlsafe(32)}"

    stream = LiveStream(
        streamer_id=current_user.id,
        **stream_data.dict(),
        stream_key=stream_key,
        status=StreamStatus.SCHEDULED if stream_data.scheduled_start else StreamStatus.SCHEDULED
    )

    result = await db.livestreams.insert_one(stream.dict(exclude={"id"}))
    stream.id = str(result.inserted_id)

    return stream


@router.get("/discover", response_model=List[LiveStreamWithStreamer])
async def discover_streams(
    current_user: User = Depends(get_current_user_dependency),
    status_filter: Optional[StreamStatus] = None,
    category: Optional[str] = None,
    subject: Optional[str] = None,
    limit: int = 50
):
    """
    Discover live and upcoming streams
    """
    db = db_service.get_db()
    query = {"is_public": True}

    if status_filter:
        query["status"] = status_filter
    else:
        # By default show live and upcoming streams
        query["status"] = {"$in": [StreamStatus.LIVE, StreamStatus.SCHEDULED]}

    if category:
        query["category"] = category
    if subject:
        query["subject"] = subject

    streams = []
    async for stream in db.livestreams.find(query).sort("created_at", -1).limit(limit):
        # Get streamer info
        try:
            streamer = await db.users.find_one({"_id": ObjectId(stream["streamer_id"])})
        except:
            streamer = await db.users.find_one({"_id": stream["streamer_id"]})
        if not streamer:
            continue

        # Check if liked and following
        is_liked = current_user.id in stream.get("liked_by", [])
        is_following = stream["streamer_id"] in (current_user.following or [])

        # Get current viewer count if live
        viewers_count = stream.get("viewers_count", 0)
        if stream["status"] == StreamStatus.LIVE:
            viewers_count = manager.get_viewer_count(str(stream["_id"]))

        streams.append(LiveStreamWithStreamer(
            id=str(stream["_id"]),
            streamer_id=stream["streamer_id"],
            streamer_username=streamer.get("username"),
            streamer_profile_picture=streamer.get("profile_picture"),
            streamer_verified=streamer.get("is_verified", False),
            title=stream["title"],
            description=stream.get("description"),
            category=stream["category"],
            subject=stream.get("subject"),
            topic=stream.get("topic"),
            status=stream["status"],
            playback_url=stream.get("playback_url") if stream["status"] == StreamStatus.LIVE else None,
            thumbnail_url=stream.get("thumbnail_url"),
            scheduled_start=stream.get("scheduled_start"),
            actual_start=stream.get("actual_start"),
            duration_minutes=stream.get("duration_minutes", 0),
            viewers_count=viewers_count,
            peak_viewers=stream.get("peak_viewers", 0),
            likes_count=stream.get("likes_count", 0),
            comments_count=stream.get("comments_count", 0),
            is_public=stream["is_public"],
            allow_comments=stream.get("allow_comments", True),
            allow_reactions=stream.get("allow_reactions", True),
            created_at=stream["created_at"],
            is_liked_by_current_user=is_liked,
            is_following_streamer=is_following
        ))

    return streams


@router.get("/my-streams", response_model=List[LiveStream])
async def get_my_streams(
    current_user: User = Depends(get_current_user_dependency)
):
    """Get user's own streams"""
    db = db_service.get_db()
    streams = []
    async for stream in db.livestreams.find({"streamer_id": current_user.id}).sort("created_at", -1):
        stream["id"] = str(stream["_id"])
        streams.append(LiveStream(**stream))
    return streams


@router.get("/{stream_id}", response_model=LiveStreamWithStreamer)
async def get_stream(
    stream_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Get stream details"""
    db = db_service.get_db()
    stream = await db.livestreams.find_one({"_id": stream_id})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    # Get streamer info
    try:
        streamer = await db.users.find_one({"_id": ObjectId(stream["streamer_id"])})
    except:
        streamer = await db.users.find_one({"_id": stream["streamer_id"]})
    if not streamer:
        raise HTTPException(status_code=404, detail="Streamer not found")

    is_liked = current_user.id in stream.get("liked_by", [])
    is_following = stream["streamer_id"] in (current_user.following or [])

    viewers_count = stream.get("viewers_count", 0)
    if stream["status"] == StreamStatus.LIVE:
        viewers_count = manager.get_viewer_count(stream_id)

    return LiveStreamWithStreamer(
        id=str(stream["_id"]),
        streamer_id=stream["streamer_id"],
        streamer_username=streamer.get("username"),
        streamer_profile_picture=streamer.get("profile_picture"),
        streamer_verified=streamer.get("is_verified", False),
        title=stream["title"],
        description=stream.get("description"),
        category=stream["category"],
        subject=stream.get("subject"),
        topic=stream.get("topic"),
        status=stream["status"],
        playback_url=stream.get("playback_url") if stream["status"] == StreamStatus.LIVE else None,
        thumbnail_url=stream.get("thumbnail_url"),
        scheduled_start=stream.get("scheduled_start"),
        actual_start=stream.get("actual_start"),
        duration_minutes=stream.get("duration_minutes", 0),
        viewers_count=viewers_count,
        peak_viewers=stream.get("peak_viewers", 0),
        likes_count=stream.get("likes_count", 0),
        comments_count=stream.get("comments_count", 0),
        is_public=stream["is_public"],
        allow_comments=stream.get("allow_comments", True),
        allow_reactions=stream.get("allow_reactions", True),
        created_at=stream["created_at"],
        is_liked_by_current_user=is_liked,
        is_following_streamer=is_following
    )


@router.post("/{stream_id}/start")
async def start_stream(
    stream_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Start a scheduled stream (go live)"""
    db = db_service.get_db()
    stream = await db.livestreams.find_one({"_id": stream_id})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    if stream["streamer_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if stream["status"] == StreamStatus.LIVE:
        raise HTTPException(status_code=400, detail="Stream already live")

    # Generate playback URL (in production, this would be from streaming service)
    playback_url = f"https://stream.ariel.com/live/{stream_id}"

    await db.livestreams.update_one(
        {"_id": stream_id},
        {
            "$set": {
                "status": StreamStatus.LIVE,
                "actual_start": datetime.utcnow(),
                "playback_url": playback_url,
                "updated_at": datetime.utcnow()
            }
        }
    )

    # Create activity
    await create_activity(
        db=db,
        user_id=current_user.id,
        activity_type=ActivityType.STORY_POSTED,  # Using story_posted for now
        title=f"{current_user.username} went live",
        description=f"started streaming: {stream['title']}",
        icon="🎥",
        metadata={"stream_id": stream_id, "title": stream["title"]}
    )

    return {"success": True, "playback_url": playback_url}


@router.post("/{stream_id}/end")
async def end_stream(
    stream_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """End a live stream"""
    db = db_service.get_db()
    stream = await db.livestreams.find_one({"_id": stream_id})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    if stream["streamer_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if stream["status"] != StreamStatus.LIVE:
        raise HTTPException(status_code=400, detail="Stream not live")

    # Calculate duration
    if stream.get("actual_start"):
        duration = datetime.utcnow() - stream["actual_start"]
        duration_minutes = int(duration.total_seconds() / 60)
    else:
        duration_minutes = 0

    await db.livestreams.update_one(
        {"_id": stream_id},
        {
            "$set": {
                "status": StreamStatus.ENDED,
                "actual_end": datetime.utcnow(),
                "duration_minutes": duration_minutes,
                "updated_at": datetime.utcnow()
            }
        }
    )

    return {"success": True, "duration_minutes": duration_minutes}


@router.post("/{stream_id}/like")
async def like_stream(
    stream_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """Like or unlike a stream"""
    db = db_service.get_db()
    stream = await db.livestreams.find_one({"_id": stream_id})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    liked_by = stream.get("liked_by", [])
    is_liked = current_user.id in liked_by

    if is_liked:
        await db.livestreams.update_one(
            {"_id": stream_id},
            {
                "$pull": {"liked_by": current_user.id},
                "$inc": {"likes_count": -1}
            }
        )
        return {"success": True, "action": "unliked"}
    else:
        await db.livestreams.update_one(
            {"_id": stream_id},
            {
                "$addToSet": {"liked_by": current_user.id},
                "$inc": {"likes_count": 1}
            }
        )
        return {"success": True, "action": "liked"}


@router.websocket("/{stream_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    stream_id: str
):
    """
    WebSocket endpoint for real-time chat and reactions
    """
    db = db_service.get_db()
    await manager.connect(stream_id, websocket)

    # Update viewer count
    viewer_count = manager.get_viewer_count(stream_id)
    await db.livestreams.update_one(
        {"_id": stream_id},
        {
            "$set": {"viewers_count": viewer_count},
            "$max": {"peak_viewers": viewer_count}
        }
    )

    # Broadcast viewer count update
    await manager.broadcast(stream_id, {
        "type": "viewer_count",
        "count": viewer_count
    })

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "comment":
                # Save comment
                comment = StreamComment(
                    stream_id=stream_id,
                    user_id=data["user_id"],
                    username=data["username"],
                    profile_picture=data.get("profile_picture"),
                    message=data["message"]
                )
                await db.stream_comments.insert_one(comment.dict(exclude={"id"}))

                # Increment comment count
                await db.livestreams.update_one(
                    {"_id": stream_id},
                    {"$inc": {"comments_count": 1}}
                )

                # Broadcast to all viewers
                await manager.broadcast(stream_id, {
                    "type": "comment",
                    **comment.dict()
                })

            elif data["type"] == "reaction":
                # Save reaction
                reaction = StreamReaction(
                    stream_id=stream_id,
                    user_id=data["user_id"],
                    reaction_type=data["reaction_type"]
                )
                await db.stream_reactions.insert_one(reaction.dict(exclude={"id"}))

                # Broadcast to all viewers
                await manager.broadcast(stream_id, {
                    "type": "reaction",
                    "reaction_type": data["reaction_type"],
                    "user_id": data["user_id"]
                })

    except WebSocketDisconnect:
        manager.disconnect(stream_id, websocket)

        # Update viewer count
        viewer_count = manager.get_viewer_count(stream_id)
        await db.livestreams.update_one(
            {"_id": stream_id},
            {"$set": {"viewers_count": viewer_count}}
        )

        # Broadcast viewer count update
        await manager.broadcast(stream_id, {
            "type": "viewer_count",
            "count": viewer_count
        })
