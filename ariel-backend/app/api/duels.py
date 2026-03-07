"""
Duels API - Real-time multiplayer flashcard battles
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Optional, Dict
from datetime import datetime
import asyncio
import secrets
import random

from app.services.database_service import db_service
from app.services.auth_service import AuthService
from app.services.user_repository import UserRepository
from app.api.auth import get_current_user_dependency
from app.models.user import User

router = APIRouter(prefix="/api/duels", tags=["duels"])

ROUND_COUNT = 5
ROUND_TIMEOUT = 15.0  # seconds per round


# ── In-memory game state ──────────────────────────────────────────────────────

class DuelRoom:
    def __init__(self, room_id: str, creator_id: str, creator_username: str):
        self.room_id = room_id
        self.p1_id = creator_id
        self.p1_username = creator_username
        self.p2_id: Optional[str] = None
        self.p2_username: Optional[str] = None
        self.status = "waiting"  # waiting | playing | finished
        self.cards: List[dict] = []
        self.current_round = 0
        self.p1_answers: List[Optional[str]] = []
        self.p2_answers: List[Optional[str]] = []
        self.p1_score = 0
        self.p2_score = 0
        self.connections: Dict[str, WebSocket] = {}


rooms: Dict[str, DuelRoom] = {}
matchmaking_queue: List[tuple] = []  # (user_id, username, room_id)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _fetch_cards(db, count: int) -> List[dict]:
    pipeline = [
        {"$match": {"visibility": "public"}},
        {"$sample": {"size": count}},
    ]
    cards = []
    async for card in db.cards.aggregate(pipeline):
        cards.append({
            "id": str(card["_id"]),
            "question": card["question"],
            "answer": card["answer"],
            "subject": card.get("subject", ""),
        })
    return cards


def _build_choices(card: dict, pool: List[dict]) -> List[str]:
    correct = card["answer"]
    distractors = [
        c["answer"] for c in pool
        if c["id"] != card["id"] and c["answer"].strip().lower() != correct.strip().lower()
    ]
    chosen = random.sample(distractors, min(3, len(distractors)))
    choices = [correct] + chosen
    random.shuffle(choices)
    return choices


async def _send(ws: Optional[WebSocket], msg: dict):
    if ws:
        try:
            await ws.send_json(msg)
        except Exception:
            pass


async def _broadcast(room: DuelRoom, msg: dict):
    for ws in list(room.connections.values()):
        await _send(ws, msg)


async def _send_player(room: DuelRoom, player_id: str, msg: dict):
    await _send(room.connections.get(player_id), msg)


async def _create_challenge_notification(db, challenger: User, challenged_id: str, room_id: str):
    name = challenger.username or challenger.full_name or "Someone"
    await db.notifications.insert_one({
        "user_id": challenged_id,
        "notification_type": "duel_challenge",
        "title": "Duel Challenge!",
        "message": f"{name} challenged you to a study duel!",
        "icon": "swords",
        "actor_id": str(challenger.id),
        "actor_username": challenger.username,
        "action_url": f"/duels/{room_id}/join",
        "metadata": {"room_id": room_id},
        "is_read": False,
        "is_archived": False,
        "created_at": datetime.utcnow(),
    })


# ── Game loop ─────────────────────────────────────────────────────────────────

async def _run_game(room: DuelRoom):
    """Runs after both players connect."""
    if room.status != "waiting" or len(room.connections) < 2:
        return

    room.status = "playing"
    db = db_service.get_db()

    # Load cards (extras for distractor generation)
    pool = await _fetch_cards(db, ROUND_COUNT * 4)
    if len(pool) < ROUND_COUNT:
        # Fallback hardcoded cards
        pool = [
            {"id": str(i), "question": q, "answer": a, "subject": s}
            for i, (q, a, s) in enumerate([
                ("What is the powerhouse of the cell?", "Mitochondria", "Biology"),
                ("What is H2O?", "Water", "Chemistry"),
                ("What year did WW2 end?", "1945", "History"),
                ("What is the speed of light (approx)?", "300,000 km/s", "Physics"),
                ("Who painted the Mona Lisa?", "Leonardo da Vinci", "Art"),
                ("What is Newton's second law?", "F = ma", "Physics"),
                ("What is the capital of France?", "Paris", "Geography"),
                ("What is the Pythagorean theorem?", "a² + b² = c²", "Mathematics"),
            ])
        ]

    game_cards = pool[:ROUND_COUNT]
    for card in game_cards:
        card["choices"] = _build_choices(card, pool)
    room.cards = game_cards
    room.p1_answers = [None] * ROUND_COUNT
    room.p2_answers = [None] * ROUND_COUNT

    # Countdown
    await _broadcast(room, {"type": "game_start", "countdown": 3})
    await asyncio.sleep(3)

    # Rounds
    for i in range(ROUND_COUNT):
        if room.status != "playing":
            break
        room.current_round = i
        await _play_round(room, i)
        if i < ROUND_COUNT - 1:
            await asyncio.sleep(2.5)  # brief pause before next round

    # Game over
    if room.status == "playing":
        room.status = "finished"
        await _send_player(room, room.p1_id, {
            "type": "game_over",
            "you_score": room.p1_score,
            "opponent_score": room.p2_score,
            "result": _result(room.p1_score, room.p2_score),
        })
        if room.p2_id:
            await _send_player(room, room.p2_id, {
                "type": "game_over",
                "you_score": room.p2_score,
                "opponent_score": room.p1_score,
                "result": _result(room.p2_score, room.p1_score),
            })


async def _play_round(room: DuelRoom, idx: int):
    card = room.cards[idx]
    await _broadcast(room, {
        "type": "round_start",
        "round": idx + 1,
        "total": ROUND_COUNT,
        "question": card["question"],
        "subject": card["subject"],
        "choices": card["choices"],
    })

    # Poll until both answer or timeout
    loop = asyncio.get_event_loop()
    deadline = loop.time() + ROUND_TIMEOUT
    while loop.time() < deadline:
        if room.p1_answers[idx] is not None and room.p2_answers[idx] is not None:
            break
        await asyncio.sleep(0.1)

    correct = card["answer"].strip().lower()
    p1_ok = room.p1_answers[idx] is not None and room.p1_answers[idx].strip().lower() == correct
    p2_ok = room.p2_answers[idx] is not None and room.p2_answers[idx].strip().lower() == correct

    if p1_ok:
        room.p1_score += 1
    if p2_ok:
        room.p2_score += 1

    payload_base = {
        "type": "round_result",
        "round": idx + 1,
        "correct_answer": card["answer"],
    }
    await _send_player(room, room.p1_id, {
        **payload_base,
        "you_correct": p1_ok,
        "opponent_correct": p2_ok,
        "you_score": room.p1_score,
        "opponent_score": room.p2_score,
        "result": _result_round(p1_ok, p2_ok),
    })
    if room.p2_id:
        await _send_player(room, room.p2_id, {
            **payload_base,
            "you_correct": p2_ok,
            "opponent_correct": p1_ok,
            "you_score": room.p2_score,
            "opponent_score": room.p1_score,
            "result": _result_round(p2_ok, p1_ok),
        })


def _result_round(me: bool, opp: bool) -> str:
    if me and not opp:
        return "win"
    if opp and not me:
        return "lose"
    return "tie"


def _result(my_score: int, opp_score: int) -> str:
    if my_score > opp_score:
        return "win"
    if opp_score > my_score:
        return "lose"
    return "tie"


# ── HTTP Endpoints ────────────────────────────────────────────────────────────

@router.post("/quick-match")
async def quick_match(current_user: User = Depends(get_current_user_dependency)):
    """Join matchmaking. Pairs with waiting player or creates a new room."""
    user_id = str(current_user.id)
    uname = current_user.username or "Player"

    global matchmaking_queue
    # Remove stale entries for this user
    matchmaking_queue = [(uid, un, rid) for uid, un, rid in matchmaking_queue if uid != user_id]

    # Try to match with someone waiting
    if matchmaking_queue:
        waiting_uid, waiting_uname, room_id = matchmaking_queue.pop(0)
        room = rooms.get(room_id)
        if room and room.status == "waiting":
            room.p2_id = user_id
            room.p2_username = uname
            return {"room_id": room_id, "status": "joined", "opponent_username": waiting_uname}

    # Create room and wait
    room_id = secrets.token_urlsafe(8)
    rooms[room_id] = DuelRoom(room_id, user_id, uname)
    matchmaking_queue.append((user_id, uname, room_id))
    return {"room_id": room_id, "status": "waiting", "opponent_username": None}


@router.post("/challenge/{username}")
async def challenge_user(
    username: str,
    current_user: User = Depends(get_current_user_dependency),
):
    """Challenge any user by username. Sends them a notification."""
    db = db_service.get_db()
    target = await db.users.find_one({"username": username})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target_id = str(target["_id"])
    if target_id == str(current_user.id):
        raise HTTPException(status_code=400, detail="Can't challenge yourself")

    room_id = secrets.token_urlsafe(8)
    rooms[room_id] = DuelRoom(room_id, str(current_user.id), current_user.username or "Player")
    await _create_challenge_notification(db, current_user, target_id, room_id)
    return {"room_id": room_id, "challenged_username": username}


@router.post("/{room_id}/join")
async def join_room(room_id: str, current_user: User = Depends(get_current_user_dependency)):
    """Accept a challenge or join a waiting room."""
    room = rooms.get(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.status != "waiting":
        raise HTTPException(status_code=400, detail="Room is not open")
    if room.p1_id == str(current_user.id):
        # Challenger polling their own room
        return {"room_id": room_id, "status": "waiting", "opponent_username": None}

    room.p2_id = str(current_user.id)
    room.p2_username = current_user.username or "Player"
    return {"room_id": room_id, "status": "ready", "opponent_username": room.p1_username}


@router.get("/{room_id}")
async def get_room(room_id: str, current_user: User = Depends(get_current_user_dependency)):
    room = rooms.get(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {
        "room_id": room.room_id,
        "status": room.status,
        "p1_username": room.p1_username,
        "p2_username": room.p2_username,
        "p1_score": room.p1_score,
        "p2_score": room.p2_score,
    }


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/{room_id}/ws")
async def duel_ws(websocket: WebSocket, room_id: str, token: str):
    """Real-time duel WebSocket. Auth via ?token=<jwt>"""
    token_data = AuthService.verify_token(token)
    if not token_data or not token_data.user_id:
        await websocket.close(code=4001)
        return

    user = await UserRepository.get_user_by_id(token_data.user_id)
    if not user:
        await websocket.close(code=4001)
        return

    user_id = str(user.id)
    username = user.username or "Player"

    room = rooms.get(room_id)
    if not room:
        await websocket.close(code=4004)
        return

    # Allow p1 reconnect, p2 join (if slot open), or existing p2
    if user_id == room.p1_id:
        pass  # p1 reconnecting
    elif room.p2_id is None and user_id != room.p1_id:
        room.p2_id = user_id
        room.p2_username = username
    elif user_id == room.p2_id:
        pass  # p2 reconnecting
    else:
        await websocket.close(code=4003)
        return

    await websocket.accept()
    room.connections[user_id] = websocket

    opponent_id = room.p2_id if user_id == room.p1_id else room.p1_id
    opponent_username = room.p2_username if user_id == room.p1_id else room.p1_username

    await websocket.send_json({
        "type": "connected",
        "room_id": room_id,
        "your_username": username,
        "opponent_username": opponent_username,
    })

    # If both players now connected, start game
    if opponent_id and opponent_id in room.connections:
        await _send_player(room, user_id, {"type": "player_joined", "opponent_username": opponent_username})
        await _send_player(room, opponent_id, {"type": "player_joined", "opponent_username": username})
        if room.status == "waiting":
            asyncio.create_task(_run_game(room))
    else:
        await websocket.send_json({"type": "waiting", "message": "Waiting for opponent..."})

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "submit_answer" and room.status == "playing":
                answer = data.get("answer", "")
                idx = room.current_round
                if idx < len(room.p1_answers):
                    if user_id == room.p1_id and room.p1_answers[idx] is None:
                        room.p1_answers[idx] = answer
                    elif user_id == room.p2_id and room.p2_answers[idx] is None:
                        room.p2_answers[idx] = answer
                    # Notify opponent that someone answered
                    opp = room.p2_id if user_id == room.p1_id else room.p1_id
                    if opp:
                        await _send_player(room, opp, {"type": "opponent_answered"})
    except WebSocketDisconnect:
        room.connections.pop(user_id, None)
        if room.status == "playing":
            await _broadcast(room, {"type": "opponent_disconnected"})
            room.status = "finished"
