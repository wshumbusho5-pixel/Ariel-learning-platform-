"""
Study Rooms API - Collaborative study sessions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime

from app.core.database import get_database
from app.core.security import get_current_user
from app.models.user import User
from app.models.study_room import StudyRoom, StudyRoomWithHost, StudyRoomCreate, RoomStatus

router = APIRouter(prefix="/api/study-rooms", tags=["study_rooms"])


@router.get("/", response_model=List[StudyRoomWithHost])
async def get_study_rooms(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    status_filter: str = "active",
    limit: int = 50
):
    """
    Get all study rooms
    """
    user_id = str(current_user.id)

    query = {"is_public": True}
    if status_filter != "all":
        query["status"] = status_filter

    rooms = []
    async for room in db.study_rooms.find(query).sort("created_at", -1).limit(limit):
        host = await db.users.find_one({"_id": room["host_id"]})
        if not host:
            continue

        is_participant = user_id in room.get("participants", [])

        rooms.append(StudyRoomWithHost(
            id=str(room["_id"]),
            host_id=room["host_id"],
            title=room["title"],
            description=room.get("description"),
            subject=room.get("subject"),
            topic=room.get("topic"),
            host_username=host.get("username"),
            host_full_name=host.get("full_name"),
            host_profile_picture=host.get("profile_picture"),
            participant_count=len(room.get("participants", [])),
            max_participants=room.get("max_participants", 10),
            is_current_user_participant=is_participant,
            status=room.get("status", RoomStatus.ACTIVE),
            scheduled_start=room.get("scheduled_start"),
            total_cards_reviewed=room.get("total_cards_reviewed", 0),
            total_time_minutes=room.get("total_time_minutes", 0),
            is_public=room.get("is_public", True),
            created_at=room["created_at"]
        ))

    return rooms


@router.post("/", response_model=StudyRoomWithHost)
async def create_study_room(
    room_data: StudyRoomCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Create a new study room
    """
    user_id = str(current_user.id)

    room = StudyRoom(
        host_id=user_id,
        title=room_data.title,
        description=room_data.description,
        subject=room_data.subject,
        topic=room_data.topic,
        max_participants=room_data.max_participants,
        is_public=room_data.is_public,
        scheduled_start=room_data.scheduled_start,
        participants=[user_id],  # Host auto-joins
        started_at=datetime.utcnow() if not room_data.scheduled_start else None,
        status=RoomStatus.SCHEDULED if room_data.scheduled_start else RoomStatus.ACTIVE
    )

    result = await db.study_rooms.insert_one(room.dict(exclude={"id"}))
    room_id = str(result.inserted_id)

    return StudyRoomWithHost(
        id=room_id,
        host_id=user_id,
        title=room.title,
        description=room.description,
        subject=room.subject,
        topic=room.topic,
        host_username=current_user.username,
        host_full_name=current_user.full_name,
        host_profile_picture=current_user.profile_picture,
        participant_count=1,
        max_participants=room.max_participants,
        is_current_user_participant=True,
        status=room.status,
        scheduled_start=room.scheduled_start,
        total_cards_reviewed=0,
        total_time_minutes=0,
        is_public=room.is_public,
        created_at=room.created_at
    )


@router.post("/{room_id}/join")
async def join_study_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Join a study room
    """
    user_id = str(current_user.id)

    room = await db.study_rooms.find_one({"_id": room_id})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study room not found"
        )

    participants = room.get("participants", [])

    if user_id in participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already in room"
        )

    if len(participants) >= room.get("max_participants", 10):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room is full"
        )

    await db.study_rooms.update_one(
        {"_id": room_id},
        {"$addToSet": {"participants": user_id}}
    )

    return {"success": True, "message": "Joined room"}


@router.post("/{room_id}/leave")
async def leave_study_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Leave a study room
    """
    user_id = str(current_user.id)

    await db.study_rooms.update_one(
        {"_id": room_id},
        {"$pull": {"participants": user_id}}
    )

    return {"success": True, "message": "Left room"}


@router.post("/{room_id}/end")
async def end_study_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    End a study room (host only)
    """
    user_id = str(current_user.id)

    room = await db.study_rooms.find_one({"_id": room_id})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study room not found"
        )

    if room["host_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only host can end room"
        )

    await db.study_rooms.update_one(
        {"_id": room_id},
        {
            "$set": {
                "status": RoomStatus.ENDED,
                "ended_at": datetime.utcnow()
            }
        }
    )

    return {"success": True, "message": "Room ended"}
