"""
Migration: clean up bot usernames (remove underscores) and card text (remove _emphasis_ patterns).
Run: MONGODB_URL=<url> DATABASE_NAME=ariel python3 fix_bot_names.py
"""
import asyncio, os, re
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DATABASE_NAME", "ariel")

def clean_username(u: str) -> str:
    """Remove underscores and hyphens from username."""
    return u.replace("_", "").replace("-", "")

def clean_text(t: str) -> str:
    """Remove _markdown_ emphasis and bare leading hyphens used as bullets."""
    if not t:
        return t
    # Remove _word_ emphasis markers (keep the word)
    t = re.sub(r'_([^_]+)_', r'\1', t)
    return t

async def main():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    print(f"Connected to {DB_NAME}\n")

    # --- Fix bot usernames ---
    bots_fixed = 0
    async for user in db.users.find({"is_bot": True}):
        old_u = user.get("username", "")
        new_u = clean_username(old_u)
        if new_u != old_u:
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"username": new_u}})
            print(f"  username: {old_u} → {new_u}")
            bots_fixed += 1

    print(f"\nFixed {bots_fixed} bot usernames\n")

    # --- Fix card text created by bots ---
    # Get all bot user IDs
    bot_ids = []
    async for u in db.users.find({"is_bot": True}, {"_id": 1}):
        bot_ids.append(str(u["_id"]))

    cards_fixed = 0
    async for card in db.cards.find({"author_id": {"$in": bot_ids}}):
        updates = {}
        for field in ("question", "answer", "explanation", "caption"):
            original = card.get(field, "")
            cleaned = clean_text(original)
            if cleaned != original:
                updates[field] = cleaned
        if updates:
            await db.cards.update_one({"_id": card["_id"]}, {"$set": updates})
            cards_fixed += 1

    print(f"Fixed {cards_fixed} cards with text formatting issues")
    print("\nDone.")
    client.close()

asyncio.run(main())
