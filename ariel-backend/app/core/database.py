"""
Database connection and utilities
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

# MongoDB client
client = None
database = None


async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, database
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.DATABASE_NAME]
    logger.info(f"Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")


def get_database():
    """Get database instance"""
    return database


async def create_indexes(db):
    """Create indexes for critical queries.

    Safe to call repeatedly -- create_index is a no-op if the index already exists.
    """
    # ---------- users ----------
    await db.users.create_index("email", unique=True)
    # Drop old non-sparse username index if it exists, then recreate as sparse
    # (non-sparse unique index breaks when multiple OAuth users have null username)
    try:
        existing = await db.users.index_information()
        if "username_1" in existing and not existing["username_1"].get("sparse", False):
            await db.users.drop_index("username_1")
            logger.info("Dropped non-sparse username_1 index")
    except Exception as e:
        logger.warning(f"Could not check/drop username_1 index: {e}")
    await db.users.create_index("username", unique=True, sparse=True)

    # ---------- cards ----------
    await db.cards.create_index("user_id")
    await db.cards.create_index("subject")

    # ---------- comments ----------
    await db.comments.create_index([("deck_id", 1), ("is_deleted", 1)])
    await db.comments.create_index([("card_id", 1), ("is_deleted", 1)])

    # ---------- stories ----------
    await db.stories.create_index([("user_id", 1), ("expires_at", -1), ("is_expired", 1)])

    # ---------- messages / conversations ----------
    await db.conversations.create_index("participant_ids")

    logger.info("Database indexes created/verified")
