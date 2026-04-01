import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
from datetime import datetime
from bson import ObjectId
from app.core.config import settings
from app.api import questions, scraper, ai, auth, progress, gamification, admin, cards, ai_generator, social, stories, achievements, notifications, comments, messages, activity_feed, study_rooms, challenges, reels, livestream, duels
from app.services.database_service import db_service
from app.core.database import connect_to_mongo, close_mongo_connection, create_indexes, get_database


async def _process_pending_bot_follows():
    """Background worker: execute delayed bot follow-backs every 60 seconds."""
    await asyncio.sleep(10)  # let DB connect first
    while True:
        try:
            db = db_service.get_db()
            now = datetime.utcnow()
            async for pending in db.pending_bot_follows.find({"execute_at": {"$lte": now}}):
                bot_id = pending["bot_id"]
                user_id = pending["user_id"]
                try:
                    # Verify bot still exists and user hasn't been followed yet
                    bot = await db.users.find_one({"_id": ObjectId(bot_id)})
                    user = await db.users.find_one({"_id": ObjectId(user_id)})
                    if not bot or not user:
                        await db.pending_bot_follows.delete_one({"_id": pending["_id"]})
                        continue

                    already = user_id in bot.get("following", [])
                    if not already:
                        await db.users.update_one(
                            {"_id": ObjectId(bot_id)},
                            {"$addToSet": {"following": user_id}, "$inc": {"following_count": 1}}
                        )
                        await db.users.update_one(
                            {"_id": ObjectId(user_id)},
                            {"$addToSet": {"followers": bot_id}, "$inc": {"followers_count": 1}}
                        )
                        # Send notification to real user
                        await db.notifications.insert_one({
                            "user_id": user_id,
                            "notification_type": "new_follower",
                            "title": "New follower",
                            "message": f"@{bot.get('username', 'someone')} started following you",
                            "icon": "👤",
                            "actor_id": bot_id,
                            "actor_username": bot.get("username"),
                            "actor_full_name": bot.get("full_name"),
                            "actor_profile_picture": bot.get("profile_picture"),
                            "is_read": False,
                            "is_archived": False,
                            "created_at": datetime.utcnow(),
                        })

                    await db.pending_bot_follows.delete_one({"_id": pending["_id"]})
                except Exception:
                    pass  # leave it for next cycle if something fails
        except Exception:
            pass
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db_service.connect_db()
    await connect_to_mongo()
    await create_indexes(get_database())
    asyncio.create_task(_process_pending_bot_follows())
    yield
    # Shutdown
    await db_service.close_db()
    await close_mongo_connection()

app = FastAPI(
    title="Ariel API",
    description="Revolutionary revision platform - AI-powered learning without distractors",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
_origins = list(settings.ALLOWED_ORIGINS)
if settings.EXTRA_ALLOWED_ORIGINS:
    _origins += [o.strip() for o in settings.EXTRA_ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(cards.router, prefix="/api/cards", tags=["cards"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(gamification.router, prefix="/api/gamification", tags=["gamification"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(scraper.router, prefix="/api/scraper", tags=["scraper"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(ai_generator.router)
app.include_router(social.router)
app.include_router(stories.router)
app.include_router(achievements.router)
app.include_router(notifications.router)
app.include_router(comments.router)
app.include_router(messages.router)
app.include_router(activity_feed.router)
app.include_router(study_rooms.router)
app.include_router(challenges.router)
app.include_router(reels.router)
app.include_router(livestream.router)
app.include_router(duels.router)

# Create uploads directory if it doesn't exist
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

# Mount static files for uploaded content
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {
        "message": "Welcome to Ariel API",
        "tagline": "Learning forward, always positive",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
