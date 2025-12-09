import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from datetime import datetime

async def fix_test_user():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["ariel"]
    
    # Delete existing user
    await db["users"].delete_one({"email": "test@ariel.com"})
    
    # Hash password with bcrypt directly
    password = "test1234"
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    print(f"Password: {password}")
    print(f"Hash: {hashed}")
    print(f"Verify: {bcrypt.checkpw(password.encode('utf-8'), hashed)}")
    
    # Create test user with proper bcrypt hash
    user_dict = {
        "email": "test@ariel.com",
        "username": "testuser",
        "full_name": "Test User",
        "hashed_password": hashed.decode('utf-8'),  # Store as string
        "auth_provider": "email",
        "provider_id": None,
        "profile_picture": None,
        "role": "user",
        "total_points": 250,
        "current_streak": 3,
        "longest_streak": 5,
        "level": 2,
        "is_active": True,
        "is_verified": False,
        "created_at": datetime.utcnow(),
        "last_login": None
    }
    
    result = await db["users"].insert_one(user_dict)
    print("\n✅ Test user created!")
    print(f"Email: test@ariel.com")
    print(f"Password: test1234")

asyncio.run(fix_test_user())
