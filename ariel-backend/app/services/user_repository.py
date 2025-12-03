from typing import Optional
from app.models.user import User, UserCreate, AuthProvider
from app.services.database_service import db_service
from app.services.auth_service import AuthService
from bson import ObjectId
from datetime import datetime

class UserRepository:
    collection_name = "users"

    @staticmethod
    async def create_user(user_data: UserCreate) -> User:
        """Create a new user with email/password"""
        db = db_service.get_db()

        # Check if user exists
        existing = await db[UserRepository.collection_name].find_one(
            {"email": user_data.email}
        )
        if existing:
            raise ValueError("User with this email already exists")

        # Hash password
        hashed_password = AuthService.get_password_hash(user_data.password)

        # Create user document
        user_dict = {
            "email": user_data.email,
            "username": user_data.username,
            "full_name": user_data.full_name,
            "hashed_password": hashed_password,
            "auth_provider": AuthProvider.EMAIL,
            "provider_id": None,
            "profile_picture": None,
            "role": "user",
            "total_points": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "level": 1,
            "is_active": True,
            "is_verified": False,
            "created_at": datetime.utcnow(),
            "last_login": None
        }

        result = await db[UserRepository.collection_name].insert_one(user_dict)
        user_dict["id"] = str(result.inserted_id)
        del user_dict["_id"]

        return User(**user_dict)

    @staticmethod
    async def create_oauth_user(user_info: dict, provider: AuthProvider) -> User:
        """Create or update user from OAuth provider"""
        db = db_service.get_db()

        # Check if user exists
        existing = await db[UserRepository.collection_name].find_one(
            {"email": user_info["email"]}
        )

        if existing:
            # Update existing user
            await db[UserRepository.collection_name].update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "last_login": datetime.utcnow(),
                        "profile_picture": user_info.get("profile_picture"),
                    }
                }
            )
            existing["id"] = str(existing["_id"])
            del existing["_id"]
            return User(**existing)

        # Create new OAuth user
        user_dict = {
            "email": user_info["email"],
            "username": user_info.get("username"),
            "full_name": user_info.get("full_name"),
            "hashed_password": None,
            "auth_provider": provider,
            "provider_id": user_info.get("provider_id"),
            "profile_picture": user_info.get("profile_picture"),
            "role": "user",
            "total_points": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "level": 1,
            "is_active": True,
            "is_verified": user_info.get("is_verified", False),
            "created_at": datetime.utcnow(),
            "last_login": datetime.utcnow()
        }

        result = await db[UserRepository.collection_name].insert_one(user_dict)
        user_dict["id"] = str(result.inserted_id)
        del user_dict["_id"]

        return User(**user_dict)

    @staticmethod
    async def get_user_by_email(email: str) -> Optional[User]:
        """Get user by email"""
        db = db_service.get_db()
        user_doc = await db[UserRepository.collection_name].find_one({"email": email})

        if user_doc:
            user_doc["id"] = str(user_doc["_id"])
            del user_doc["_id"]
            return User(**user_doc)
        return None

    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[User]:
        """Get user by ID"""
        db = db_service.get_db()
        user_doc = await db[UserRepository.collection_name].find_one(
            {"_id": ObjectId(user_id)}
        )

        if user_doc:
            user_doc["id"] = str(user_doc["_id"])
            del user_doc["_id"]
            return User(**user_doc)
        return None

    @staticmethod
    async def update_user(user_id: str, update_data: dict) -> Optional[User]:
        """Update user"""
        db = db_service.get_db()
        await db[UserRepository.collection_name].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return await UserRepository.get_user_by_id(user_id)

    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await UserRepository.get_user_by_email(email)
        if not user:
            return None
        if user.auth_provider != AuthProvider.EMAIL:
            return None
        if not AuthService.verify_password(password, user.hashed_password):
            return None

        # Update last login
        await UserRepository.update_user(user.id, {"last_login": datetime.utcnow()})
        user.last_login = datetime.utcnow()

        return user
