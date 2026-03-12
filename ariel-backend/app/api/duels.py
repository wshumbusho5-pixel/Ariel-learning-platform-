"""
Duels API - Real-time multiplayer flashcard battles (up to 4 players)
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel
import asyncio
import secrets
import random
from bson import ObjectId

from app.services.database_service import db_service
from app.services.auth_service import AuthService
from app.services.user_repository import UserRepository
from app.api.auth import get_current_user_dependency
from app.models.user import User

router = APIRouter(prefix="/api/duels", tags=["duels"])

ROUND_TIMEOUT = 15.0  # seconds per round
MAX_ROUND_COUNT = 20
MIN_ROUND_COUNT = 5


# ── Request models ────────────────────────────────────────────────────────────

class QuickMatchRequest(BaseModel):
    subject: Optional[str] = None   # None or "any" = mixed
    round_count: int = 5
    max_players: int = 2            # 2 or 4


class ChallengeRequest(BaseModel):
    subject: Optional[str] = None
    round_count: int = 5


# ── In-memory game state ──────────────────────────────────────────────────────

class DuelRoom:
    def __init__(
        self,
        room_id: str,
        creator_id: str,
        creator_username: str,
        subject: Optional[str] = None,
        round_count: int = 5,
        max_players: int = 2,
    ):
        self.room_id = room_id
        self.creator_id = creator_id          # whose deck to use for questions
        self.subject = subject                 # subject filter (None = any)
        self.round_count = max(MIN_ROUND_COUNT, min(MAX_ROUND_COUNT, round_count))
        self.max_players = max(2, min(4, max_players))

        self.status = "waiting"               # waiting | playing | finished
        self.cards: List[dict] = []
        self.current_round = 0
        self.round_answers: Dict[str, Optional[str]] = {}  # player_id -> answer

        # Flexible N-player tracking
        self.players: Dict[str, str] = {creator_id: creator_username}  # id -> username
        self.scores: Dict[str, int] = {creator_id: 0}
        self.connections: Dict[str, WebSocket] = {}

        # Keep 2-player compat fields
        self.p1_id = creator_id
        self.p1_username = creator_username
        self.p2_id: Optional[str] = None
        self.p2_username: Optional[str] = None


rooms: Dict[str, DuelRoom] = {}
# queue entry: (user_id, username, room_id, max_players)
matchmaking_queue: List[tuple] = []


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _fetch_cards_for_room(db, room: DuelRoom) -> List[dict]:
    """
    Fetch cards from the creator's deck (filtered by subject), then
    supplement with public cards if not enough.
    """
    need = room.round_count + 6   # extras for distractor generation
    subject = room.subject
    cards: List[dict] = []
    seen: set = set()

    def _row(card: dict) -> dict:
        return {
            "id": str(card["_id"]),
            "question": card["question"],
            "answer": card["answer"],
            "subject": card.get("subject", ""),
        }

    # 1. Creator's own cards
    q: dict = {"user_id": room.creator_id}
    if subject and subject.lower() != "any":
        q["subject"] = {"$regex": subject, "$options": "i"}
    async for card in db.cards.aggregate([{"$match": q}, {"$sample": {"size": need}}]):
        cid = str(card["_id"])
        if cid not in seen:
            seen.add(cid)
            cards.append(_row(card))

    # 2. Public cards of same subject (supplement)
    if len(cards) < need:
        pub_q: dict = {"visibility": "public", "_id": {"$nin": [ObjectId(i) for i in seen]}}
        if subject and subject.lower() != "any":
            pub_q["subject"] = {"$regex": subject, "$options": "i"}
        async for card in db.cards.aggregate([{"$match": pub_q}, {"$sample": {"size": need - len(cards)}}]):
            cid = str(card["_id"])
            if cid not in seen:
                seen.add(cid)
                cards.append(_row(card))

    # 3. Any public cards (last resort)
    if len(cards) < need:
        async for card in db.cards.aggregate([
            {"$match": {"visibility": "public", "_id": {"$nin": [ObjectId(i) for i in seen]}}},
            {"$sample": {"size": need - len(cards)}}
        ]):
            cid = str(card["_id"])
            if cid not in seen:
                seen.add(cid)
                cards.append(_row(card))

    return cards[:need]


FALLBACK_CARDS = [
    {"id": "f1", "question": "What is the powerhouse of the cell?", "answer": "Mitochondria", "subject": "Biology"},
    {"id": "f2", "question": "What is H₂O?", "answer": "Water", "subject": "Chemistry"},
    {"id": "f3", "question": "What year did WW2 end?", "answer": "1945", "subject": "History"},
    {"id": "f4", "question": "What is the speed of light (approx)?", "answer": "300,000 km/s", "subject": "Physics"},
    {"id": "f5", "question": "Who painted the Mona Lisa?", "answer": "Leonardo da Vinci", "subject": "Art"},
    {"id": "f6", "question": "What is Newton's second law?", "answer": "F = ma", "subject": "Physics"},
    {"id": "f7", "question": "What is the capital of France?", "answer": "Paris", "subject": "Geography"},
    {"id": "f8", "question": "What is the Pythagorean theorem?", "answer": "a² + b² = c²", "subject": "Mathematics"},
    {"id": "f9", "question": "What is the chemical symbol for gold?", "answer": "Au", "subject": "Chemistry"},
    {"id": "f10", "question": "How many sides does a hexagon have?", "answer": "6", "subject": "Mathematics"},
]


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


async def _create_challenge_notification(db, challenger: User, challenged_id: str, room_id: str, subject: Optional[str], round_count: int):
    name = challenger.username or challenger.full_name or "Someone"
    subj_str = f" on {subject}" if subject and subject.lower() != "any" else ""
    await db.notifications.insert_one({
        "user_id": challenged_id,
        "notification_type": "duel_challenge",
        "title": "Duel Challenge!",
        "message": f"{name} challenged you to a {round_count}-question duel{subj_str}!",
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
    required = room.max_players
    if room.status != "waiting" or len(room.connections) < required:
        print(f"[DUEL] _run_game skipped: status={room.status} connections={len(room.connections)}/{required}")
        return
    try:
        print(f"[DUEL] Starting game room={room.room_id} players={list(room.players.values())} rounds={room.round_count} subject={room.subject}")
        await _run_game_inner(room)
        print(f"[DUEL] Game finished room={room.room_id}")
    except Exception as e:
        import traceback
        print(f"[DUEL] CRASH room={room.room_id}: {e}")
        traceback.print_exc()
        room.status = "finished"
        await _broadcast(room, {"type": "error", "message": "Game failed to start. Please try again."})


async def _run_game_inner(room: DuelRoom):
    room.status = "playing"
    db = db_service.get_db()

    # Fetch cards
    pool = await _fetch_cards_for_room(db, room)
    if len(pool) < room.round_count:
        # Pad with fallback cards
        extra = [c for c in FALLBACK_CARDS if c["id"] not in {x["id"] for x in pool}]
        pool = pool + extra
    if not pool:
        await _broadcast(room, {"type": "error", "message": "No cards found. Add some public flashcards first!"})
        room.status = "finished"
        return

    game_cards = pool[:room.round_count]
    for card in game_cards:
        card["choices"] = _build_choices(card, pool)
    room.cards = game_cards

    player_list = [{"username": room.players[p], "id": p} for p in room.players]
    await _broadcast(room, {
        "type": "game_start",
        "countdown": 3,
        "round_count": room.round_count,
        "subject": room.subject or "Mixed",
        "players": player_list,
    })
    await asyncio.sleep(3)

    for i in range(room.round_count):
        if room.status != "playing":
            break
        await _play_round(room, i)
        if i < room.round_count - 1:
            await asyncio.sleep(2.5)

    if room.status == "playing":
        room.status = "finished"
        ranking = sorted(room.players.items(), key=lambda x: room.scores.get(x[0], 0), reverse=True)
        ranking_list = [{"username": room.players[p], "score": room.scores.get(p, 0)} for p, _ in ranking]

        for pid in list(room.connections.keys()):
            my_score = room.scores.get(pid, 0)
            rank = next((i + 1 for i, (p, _) in enumerate(ranking) if p == pid), 1)
            # For 2-player compat: find "opponent" score
            others = [room.scores.get(p, 0) for p in room.players if p != pid]
            opp_score = others[0] if others else 0
            result = "win" if rank == 1 else ("tie" if my_score == ranking[0][1] else "lose")
            # Handle tie for first place
            top_score = room.scores.get(ranking[0][0], 0)
            result = "win" if my_score == top_score and my_score > 0 else ("lose" if my_score < top_score else "tie")

            await _send_player(room, pid, {
                "type": "game_over",
                "you_score": my_score,
                "opponent_score": opp_score,
                "result": result,
                "ranking": ranking_list,
            })


async def _play_round(room: DuelRoom, idx: int):
    card = room.cards[idx]
    room.current_round = idx
    room.round_answers = {pid: None for pid in room.players}

    await _broadcast(room, {
        "type": "round_start",
        "round": idx + 1,
        "total": room.round_count,
        "question": card["question"],
        "subject": card["subject"],
        "choices": card["choices"],
    })

    # Wait for all connected players to answer or timeout
    loop = asyncio.get_running_loop()
    deadline = loop.time() + ROUND_TIMEOUT
    while loop.time() < deadline:
        connected_players = set(room.connections.keys()) & set(room.round_answers.keys())
        if connected_players and all(room.round_answers.get(p) is not None for p in connected_players):
            break
        await asyncio.sleep(0.1)

    correct = card["answer"].strip().lower()
    for pid in room.players:
        ans = room.round_answers.get(pid)
        if ans is not None and ans.strip().lower() == correct:
            room.scores[pid] = room.scores.get(pid, 0) + 1

    # Send personalised result to each player
    for pid in list(room.connections.keys()):
        my_ans = room.round_answers.get(pid)
        my_correct = bool(my_ans and my_ans.strip().lower() == correct)
        others_correct = {
            room.players[p]: room.round_answers.get(p) is not None and room.round_answers.get(p, "").strip().lower() == correct
            for p in room.players if p != pid
        }
        # 2-player compat
        opp_ids = [p for p in room.players if p != pid]
        opp_correct = bool(room.round_answers.get(opp_ids[0], None) and room.round_answers.get(opp_ids[0], "").strip().lower() == correct) if opp_ids else False
        opp_score = room.scores.get(opp_ids[0], 0) if opp_ids else 0

        def _rnd_result(me: bool, opp: bool) -> str:
            if me and not opp: return "win"
            if opp and not me: return "lose"
            return "tie"

        await _send_player(room, pid, {
            "type": "round_result",
            "round": idx + 1,
            "correct_answer": card["answer"],
            "you_correct": my_correct,
            "opponent_correct": opp_correct,
            "you_score": room.scores.get(pid, 0),
            "opponent_score": opp_score,
            "result": _rnd_result(my_correct, opp_correct),
            "scores": {room.players[p]: room.scores.get(p, 0) for p in room.players},
            "others_correct": others_correct,
        })


# ── HTTP Endpoints ────────────────────────────────────────────────────────────

@router.post("/quick-match")
async def quick_match(
    body: QuickMatchRequest = QuickMatchRequest(),
    current_user: User = Depends(get_current_user_dependency),
):
    """Join matchmaking queue. Pairs players by max_players preference."""
    user_id = str(current_user.id)
    uname = current_user.username or "Player"
    max_players = max(2, min(4, body.max_players))
    round_count = max(MIN_ROUND_COUNT, min(MAX_ROUND_COUNT, body.round_count))
    subject = body.subject if body.subject and body.subject.lower() != "any" else None

    global matchmaking_queue

    # Dedup: if user already in queue, return their room
    for entry in matchmaking_queue:
        if entry[0] == user_id:
            return {"room_id": entry[2], "status": "waiting", "opponent_username": None}

    # Find an existing open room with same max_players
    for entry in list(matchmaking_queue):
        e_uid, e_uname, e_rid, e_max = entry
        room = rooms.get(e_rid)
        if not room or room.status != "waiting":
            matchmaking_queue.remove(entry)
            continue
        if e_max == max_players and len(room.players) < max_players and e_uid != user_id:
            # Join this room
            room.players[user_id] = uname
            room.scores[user_id] = 0
            if room.p2_id is None:
                room.p2_id = user_id
                room.p2_username = uname
            # Remove from queue if now full
            if len(room.players) >= max_players:
                matchmaking_queue.remove(entry)
            first_username = e_uname
            return {"room_id": e_rid, "status": "joined", "opponent_username": first_username}

    # Create a new room and wait
    room_id = secrets.token_urlsafe(8)
    rooms[room_id] = DuelRoom(room_id, user_id, uname, subject=subject, round_count=round_count, max_players=max_players)
    matchmaking_queue.append((user_id, uname, room_id, max_players))
    return {"room_id": room_id, "status": "waiting", "opponent_username": None}


@router.post("/challenge/{username}")
async def challenge_user(
    username: str,
    body: ChallengeRequest = ChallengeRequest(),
    current_user: User = Depends(get_current_user_dependency),
):
    """Challenge a specific user. Questions come from challenger's deck."""
    db = db_service.get_db()
    target = await db.users.find_one({"username": username})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target_id = str(target["_id"])
    if target_id == str(current_user.id):
        raise HTTPException(status_code=400, detail="Can't challenge yourself")

    subject = body.subject if body.subject and body.subject.lower() != "any" else None
    round_count = max(MIN_ROUND_COUNT, min(MAX_ROUND_COUNT, body.round_count))

    room_id = secrets.token_urlsafe(8)
    rooms[room_id] = DuelRoom(
        room_id, str(current_user.id), current_user.username or "Player",
        subject=subject, round_count=round_count, max_players=2
    )
    await db.duel_rooms.insert_one({
        "room_id": room_id,
        "p1_id": str(current_user.id),
        "p1_username": current_user.username or "Player",
        "subject": subject,
        "round_count": round_count,
        "status": "waiting",
        "created_at": datetime.utcnow(),
    })
    await _create_challenge_notification(db, current_user, target_id, room_id, subject, round_count)
    return {"room_id": room_id, "challenged_username": username}


@router.post("/{room_id}/join")
async def join_room(room_id: str, current_user: User = Depends(get_current_user_dependency)):
    """Accept a challenge or join a waiting room."""
    room = rooms.get(room_id)
    if not room:
        db = db_service.get_db()
        stored = await db.duel_rooms.find_one({"room_id": room_id, "status": "waiting"})
        if not stored:
            raise HTTPException(status_code=404, detail="Challenge has expired. Ask them to send a new one.")
        room = DuelRoom(
            room_id, stored["p1_id"], stored["p1_username"],
            subject=stored.get("subject"), round_count=stored.get("round_count", 5)
        )
        rooms[room_id] = room
    if room.status != "waiting":
        raise HTTPException(status_code=400, detail="Room is not open")
    if room.p1_id == str(current_user.id):
        return {"room_id": room_id, "status": "waiting", "opponent_username": None}

    uid = str(current_user.id)
    uname = current_user.username or "Player"
    room.players[uid] = uname
    room.scores[uid] = 0
    room.p2_id = uid
    room.p2_username = uname
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
        "subject": room.subject,
        "round_count": room.round_count,
        "max_players": room.max_players,
        "players": room.players,
        "scores": room.scores,
    }


@router.get("/my-subjects")
async def get_my_subjects(current_user: User = Depends(get_current_user_dependency)):
    """Return distinct subjects from the current user's cards."""
    db = db_service.get_db()
    subjects = await db.cards.distinct("subject", {"user_id": str(current_user.id)})
    return [s for s in subjects if s]


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/{room_id}/ws")
async def duel_ws(websocket: WebSocket, room_id: str, token: str):
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

    # Allow: existing player reconnecting, or new slot open
    if user_id not in room.players:
        if len(room.players) < room.max_players:
            room.players[user_id] = username
            room.scores[user_id] = 0
            if room.p2_id is None:
                room.p2_id = user_id
                room.p2_username = username
        else:
            await websocket.close(code=4003)
            return

    await websocket.accept()
    room.connections[user_id] = websocket

    # Notify this player of current room state
    await websocket.send_json({
        "type": "connected",
        "room_id": room_id,
        "your_username": username,
        "players": {pid: room.players[pid] for pid in room.connections},
        "max_players": room.max_players,
        "round_count": room.round_count,
        "subject": room.subject or "Mixed",
        # 2-player compat
        "opponent_username": next((room.players[p] for p in room.players if p != user_id), None),
    })

    connected_count = len(room.connections)

    if connected_count >= room.max_players:
        if room.status == "waiting":
            # All players in — notify everyone and start
            for pid in room.connections:
                others = [room.players[p] for p in room.connections if p != pid]
                await _send_player(room, pid, {
                    "type": "player_joined",
                    "opponent_username": others[0] if others else "",
                    "players": list(room.players.values()),
                    "players_connected": connected_count,
                    "max_players": room.max_players,
                })
            asyncio.create_task(_run_game(room))
        elif room.status == "playing":
            # Reconnect mid-game
            idx = room.current_round
            if idx < len(room.cards):
                card = room.cards[idx]
                await websocket.send_json({
                    "type": "round_start",
                    "round": idx + 1,
                    "total": room.round_count,
                    "question": card["question"],
                    "subject": card["subject"],
                    "choices": card["choices"],
                })
    elif connected_count > 1:
        # Notify existing players someone new joined
        for pid in room.connections:
            if pid != user_id:
                await _send_player(room, pid, {
                    "type": "player_joined",
                    "opponent_username": username,
                    "players": list(room.players.values()),
                    "players_connected": connected_count,
                    "max_players": room.max_players,
                })
        await websocket.send_json({
            "type": "waiting",
            "message": f"Waiting for more players... ({connected_count}/{room.max_players})",
            "players_connected": connected_count,
            "max_players": room.max_players,
        })
    else:
        await websocket.send_json({
            "type": "waiting",
            "message": "Waiting for opponent..." if room.max_players == 2 else f"Waiting for players... (1/{room.max_players})",
            "players_connected": 1,
            "max_players": room.max_players,
        })

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "submit_answer" and room.status == "playing":
                answer = data.get("answer", "")
                if room.round_answers.get(user_id) is None:
                    room.round_answers[user_id] = answer
                    # Notify others that someone answered
                    for pid in room.connections:
                        if pid != user_id:
                            await _send_player(room, pid, {"type": "opponent_answered"})
    except WebSocketDisconnect:
        room.connections.pop(user_id, None)
        if room.status == "playing":
            await _broadcast(room, {"type": "opponent_disconnected"})
            room.status = "finished"
