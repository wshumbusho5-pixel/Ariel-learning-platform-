from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
from app.core.config import settings
from app.api import questions, scraper, ai, auth, progress, gamification, admin, cards, ai_generator, social, stories, achievements, notifications, comments, messages, activity_feed, study_rooms, challenges, reels, livestream
from app.services.database_service import db_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db_service.connect_db()
    yield
    # Shutdown
    await db_service.close_db()

app = FastAPI(
    title="Ariel API",
    description="Revolutionary revision platform - AI-powered learning without distractors",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
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
