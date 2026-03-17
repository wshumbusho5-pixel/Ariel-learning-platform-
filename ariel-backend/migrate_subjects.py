"""
Migration: normalize all subject fields to canonical values.

Run once against the live database:
    cd ariel-backend
    python migrate_subjects.py

Safe to re-run — documents already on a canonical value will be skipped
(their $set value is identical so MongoDB is a no-op).
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.subjects import normalize_subject, CANONICAL_SUBJECTS

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ariel")


async def migrate():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    collections = {
        "cards":  ["subject"],
        "decks":  ["subject"],
        "users":  [],   # users.subjects is a list — handled separately
    }

    total_updated = 0

    # ── cards & decks ──────────────────────────────────────────────────────────
    for col_name, fields in collections.items():
        col = db[col_name]
        for field in fields:
            cursor = col.find({field: {"$exists": True, "$ne": None}})
            batch = []
            async for doc in cursor:
                raw = doc.get(field)
                canonical = normalize_subject(raw)
                if raw != canonical:
                    batch.append((doc["_id"], canonical))

            for _id, canonical in batch:
                await col.update_one({"_id": _id}, {"$set": {field: canonical}})

            print(f"  {col_name}.{field}: {len(batch)} documents updated")
            total_updated += len(batch)

    # ── users.subjects (List[str]) ─────────────────────────────────────────────
    users_col = db["users"]
    users_updated = 0
    async for user in users_col.find({"subjects": {"$exists": True, "$ne": []}}):
        old_subjects = user.get("subjects", [])
        new_subjects = list(dict.fromkeys(  # deduplicate while preserving order
            normalize_subject(s) for s in old_subjects
        ))
        if old_subjects != new_subjects:
            await users_col.update_one(
                {"_id": user["_id"]},
                {"$set": {"subjects": new_subjects}}
            )
            users_updated += 1

    print(f"  users.subjects: {users_updated} documents updated")
    total_updated += users_updated

    print(f"\nMigration complete. Total documents updated: {total_updated}")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
