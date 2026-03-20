"""
Fix bot card/deck created_at dates to Feb 1 – Mar 19 2026 range.
Run: MONGODB_URL=<url> DATABASE_NAME=ariel python3 fix_bot_dates.py
"""
import asyncio, os, random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DATABASE_NAME", "ariel")

# Feb 1 2026 to Mar 18 2026 (leave Mar 19 as "today")
START = datetime(2026, 2, 1)
END   = datetime(2026, 3, 18)
RANGE_SECONDS = int((END - START).total_seconds())


def rand_date():
    return START + timedelta(seconds=random.randint(0, RANGE_SECONDS))


async def main():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    # Get bot user IDs
    bot_ids = []
    async for u in db.users.find({"is_bot": True}, {"_id": 1}):
        bot_ids.append(str(u["_id"]))
    print(f"Found {len(bot_ids)} bots")

    # Fix cards
    card_count = 0
    async for card in db.cards.find({"user_id": {"$in": bot_ids}}, {"_id": 1}):
        d = rand_date()
        await db.cards.update_one({"_id": card["_id"]}, {"$set": {"created_at": d, "updated_at": d}})
        card_count += 1
    print(f"Updated {card_count} bot cards")

    # Fix decks
    deck_count = 0
    async for deck in db.decks.find({"user_id": {"$in": bot_ids}}, {"_id": 1}):
        d = rand_date()
        await db.decks.update_one({"_id": deck["_id"]}, {"$set": {"created_at": d, "updated_at": d}})
        deck_count += 1
    print(f"Updated {deck_count} bot decks")

    client.close()
    print("Done.")


asyncio.run(main())
