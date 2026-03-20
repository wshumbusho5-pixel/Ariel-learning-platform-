"""
Fix:
  1. Unique profile pictures for all bots (198 deterministic randomuser.me portrait URLs)
  2. Seed bot comments into card_comments collection (what CommentsDrawer actually reads)

Run: MONGODB_URL=<url> DATABASE_NAME=ariel python3 fix_pics_and_card_comments.py
"""
import asyncio, os, random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DATABASE_NAME", "ariel")

# 198 unique portrait URLs — men/1-99, women/1-99
MALE_URLS   = [f"https://randomuser.me/api/portraits/men/{i}.jpg"   for i in range(1, 100)]
FEMALE_URLS = [f"https://randomuser.me/api/portraits/women/{i}.jpg" for i in range(1, 100)]
ALL_PORTRAITS = MALE_URLS + FEMALE_URLS  # 198 unique

COMMENT_POOL = [
    "Added this straight to my deck — been looking for a clean version of this explanation",
    "Lost a duel on this exact question yesterday. Not again 😤",
    "This came up in cram mode and I completely blanked. Bookmarking now.",
    "My study group has been debating this for days — the answer is right here",
    "Duelled someone on this topic last night and this would've won it for me",
    "Perfect for a quick cram before lecture. Short and exactly right.",
    "Three cards in and my Ariel streak is already threatened by this topic lol",
    "Honestly the explanation here beats my textbook",
    "Saved to my deck. The framing is what makes it stick.",
    "This is the card I needed 2 days ago before my mock exam 😅",
    "The nuance here is what gets people in duels — easy to miss",
    "Going in my cram deck immediately. This is exam board language.",
    "Anyone else building a deck around this subject? Drop it",
    "Tested myself on this in cram mode four times. Finally locked in.",
    "The follow-up question at the bottom is harder than the main one",
    "This is what a good card looks like — no fluff, no ambiguity",
    "Lost marks on this in prelims. The explanation finally makes it click.",
    "Didn't realise these two were connected like that. Deck updated.",
    "Challenged someone to a duel on this and they had no idea. Easy win.",
    "Short enough to read before sleep, good enough to actually remember",
    "This is exactly the distinction exam markers look for",
    "Shared this with my cohort. Two people added it to their decks immediately.",
    "My cram session just got a lot more focused. Thank you.",
    "Counterintuitive at first, but once you get it you'll never forget it",
    "Subtle but this is the kind of point that separates a pass from a distinction",
    "Been doing Ariel cram sessions every night this week — this card just earned its place",
    "First time this concept made sense. Adding to deck.",
    "Clean, precise, nothing wasted. This is how all cards should be written.",
    "Got challenged to a duel on this topic and realised I didn't actually know it. Studying now.",
    "The real-world context is what makes this memorable. Great card.",
    "Exactly what my lecturer glossed over. The detail here matters.",
    "This is going in my spaced repetition queue — needs drilling",
    "Just used this in an essay. Glad I had it in my deck already.",
    "Ariel cram mode with cards like this actually works. First time I feel prepared.",
    "This would settle so many duel arguments. Sending to my whole group chat.",
    "The wording here is precise. That's what makes the difference.",
    "I failed a question on this last semester. Not this time.",
    "Efficient. Exactly what you need the night before an exam.",
    "Added to my deck and challenged three people. Won all of them 😅",
    "This is the version of this explanation I'll actually remember.",
]


async def main():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    # ------------------------------------------------------------------ #
    # 1. UNIQUE PROFILE PICTURES
    # ------------------------------------------------------------------ #
    print("Fetching bot users...")
    bots = []
    async for u in db.users.find({"is_bot": True}, {"_id": 1, "username": 1}):
        bots.append(u)
    print(f"  Found {len(bots)} bots")

    urls = ALL_PORTRAITS.copy()
    random.shuffle(urls)

    print("Assigning unique profile pictures...")
    for i, bot in enumerate(bots):
        pic = urls[i % len(urls)]
        await db.users.update_one(
            {"_id": bot["_id"]},
            {"$set": {"profile_picture": pic}}
        )
    print(f"  Done — {len(bots)} unique pictures assigned")

    # ------------------------------------------------------------------ #
    # 2. SEED CARD COMMENTS INTO card_comments COLLECTION
    # ------------------------------------------------------------------ #
    print("\nDeleting old bot card comments...")
    bot_ids = [str(b["_id"]) for b in bots]
    del_result = await db.card_comments.delete_many({"user_id": {"$in": bot_ids}})
    print(f"  Deleted {del_result.deleted_count} old bot card comments")

    # Get all bot cards
    print("Fetching bot cards...")
    bot_cards = []
    async for card in db.cards.find({"user_id": {"$in": bot_ids}}, {"_id": 1, "user_id": 1}):
        bot_cards.append(card)
    print(f"  Found {len(bot_cards)} bot cards")

    if not bot_cards:
        print("  No bot cards found — run fix_comments_and_cards.py first")
        client.close()
        return

    # Build a lookup: bot_id -> bot user doc (with username, profile_picture)
    print("Building bot user lookup...")
    bot_lookup = {}
    for bot_id in bot_ids:
        u = await db.users.find_one({"_id": ObjectId(bot_id)}, {"username": 1, "profile_picture": 1})
        if u:
            bot_lookup[bot_id] = u

    # For each card, pick 1-3 random bots (not the card's owner) to leave comments
    print("Seeding card comments...")
    total_comments = 0
    for card in bot_cards:
        card_id_str = str(card["_id"])
        card_owner_id = str(card["user_id"])

        # Pick 1-3 commenters that aren't the card owner
        commenters = [bid for bid in bot_ids if bid != card_owner_id]
        if not commenters:
            continue
        num_comments = random.randint(1, min(3, len(commenters)))
        chosen = random.sample(commenters, num_comments)

        for commenter_id in chosen:
            commenter = bot_lookup.get(commenter_id)
            if not commenter:
                continue
            days_ago = random.randint(1, 30)
            comment_doc = {
                "_id": ObjectId(),
                "card_id": card_id_str,
                "user_id": commenter_id,           # string — matches how the API stores it
                "username": commenter.get("username", ""),
                "profile_picture": commenter.get("profile_picture"),
                "content": random.choice(COMMENT_POOL),
                "created_at": datetime.utcnow() - timedelta(days=days_ago),
                "likes": random.randint(0, 22),
                "liked_by": [],
                "is_deleted": False,
            }
            await db.card_comments.insert_one(comment_doc)
            total_comments += 1

    print(f"  Seeded {total_comments} card comments across {len(bot_cards)} cards")

    # Quick sanity check
    count = await db.card_comments.count_documents({"is_deleted": {"$ne": True}})
    print(f"\nTotal card_comments in DB: {count}")

    client.close()
    print("\nDone.")


asyncio.run(main())
