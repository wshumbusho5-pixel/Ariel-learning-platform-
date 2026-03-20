"""
Update all bot profile pictures to African/young-people photos from randomuser.me.
Run: MONGODB_URL=<url> DATABASE_NAME=ariel python3 update_bot_pics.py
"""
import asyncio, os, json
from urllib.request import urlopen
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DATABASE_NAME", "ariel")

def fetch_african_photos(n=110):
    """Fetch profile picture URLs from randomuser.me — African + South Asian nationalities, young."""
    # nat=ng (Nigeria), gh (Ghana), ke (Kenya), za (South Africa), et (Ethiopia)
    # Also include in (India) and ir (Iran) for the non-African named personas
    url = f"https://randomuser.me/api/?nat=ng,gh,ke,za,et,cm,ug,tz&results={n}&inc=picture,gender&noinfo"
    try:
        with urlopen(url, timeout=15) as r:
            data = json.loads(r.read())
        photos = []
        for u in data.get("results", []):
            large = u.get("picture", {}).get("large", "")
            if large:
                photos.append(large)
        return photos
    except Exception as e:
        print(f"  Warning: could not fetch from randomuser.me ({e}), using fallback")
        return []

async def main():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    print("Fetching African profile photos from randomuser.me...")
    photos = fetch_african_photos(110)
    print(f"  Got {len(photos)} photos")

    if len(photos) < 10:
        print("  Not enough photos fetched, aborting.")
        client.close()
        return

    bots = []
    async for u in db.users.find({"is_bot": True}, {"_id": 1, "username": 1}):
        bots.append(u)

    print(f"Updating {len(bots)} bot profile pictures...")
    for i, bot in enumerate(bots):
        pic = photos[i % len(photos)]
        await db.users.update_one(
            {"_id": bot["_id"]},
            {"$set": {"profile_picture": pic}}
        )
        print(f"  {bot.get('username')} → {pic}")

    print(f"\nDone. Updated {len(bots)} bots.")
    client.close()

asyncio.run(main())
