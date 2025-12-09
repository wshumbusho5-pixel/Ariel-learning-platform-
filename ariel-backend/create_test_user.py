import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from datetime import datetime

async def create_test_user():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["ariel"]
    
    # Check if user exists
    existing = await db["users"].find_one({"email": "test@ariel.com"})
    if existing:
        print("✅ Test user already exists!")
        print(f"Email: test@ariel.com")
        print(f"Password: test1234")
        return
    
    # Hash password directly with bcrypt
    password = "test1234"
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create test user
    user_dict = {
        "email": "test@ariel.com",
        "username": "testuser",
        "full_name": "Test User",
        "hashed_password": hashed,
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
    print("✅ Test user created successfully!")
    print(f"Email: test@ariel.com")
    print(f"Password: test1234")
    print(f"Starting points: 250")
    print(f"Starting streak: 3 days")

asyncio.run(create_test_user())
