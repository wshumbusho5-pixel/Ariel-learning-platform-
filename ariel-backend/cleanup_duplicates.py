"""
Run this once to merge duplicate accounts caused by the Google OAuth email case bug.
Usage: MONGODB_URL=<your-railway-url> python cleanup_duplicates.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from collections import defaultdict

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DATABASE_NAME", "ariel_db")

async def main():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    users = db["users"]

    # Find all users, group by lowercase email
    all_users = await users.find({}).to_list(length=None)
    by_email = defaultdict(list)
    for u in all_users:
        by_email[u["email"].strip().lower()].append(u)

    duplicates = {e: docs for e, docs in by_email.items() if len(docs) > 1}
    if not duplicates:
        print("No duplicate accounts found.")
        return

    for email, docs in duplicates.items():
        # Keep the oldest account (most data), delete the newer one(s)
        docs.sort(key=lambda d: d.get("created_at") or 0)
        keeper = docs[0]
        to_delete = docs[1:]
        print(f"\nEmail: {email}")
        print(f"  Keeping : {keeper['_id']} | username={keeper.get('username')} | created={keeper.get('created_at')}")
        for d in to_delete:
            print(f"  Deleting: {d['_id']} | username={d.get('username')} | created={d.get('created_at')}")
            await users.delete_one({"_id": d["_id"]})
        print(f"  Done.")

    client.close()
    print("\nCleanup complete.")

asyncio.run(main())
