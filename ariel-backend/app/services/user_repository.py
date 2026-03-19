from typing import Optional
from app.models.user import User, UserCreate, AuthProvider, UserProfileUpdate
from app.services.database_service import db_service
from app.services.auth_service import AuthService
from bson import ObjectId
from datetime import datetime

class UserRepository:
    collection_name = "users"

    @staticmethod
    def _hydrate_user(user_doc: dict) -> User:
        """Convert Mongo document to User model with normalized AI settings."""
        user_doc["id"] = str(user_doc["_id"])
        del user_doc["_id"]

        ai_settings = user_doc.get("ai_settings")
        if isinstance(ai_settings, dict):
            ai_settings["has_api_key"] = bool(ai_settings.get("encrypted_api_key"))
            user_doc["ai_settings"] = ai_settings

        return User(**user_doc)

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

        # Validate password length (bcrypt limit is 72 bytes)
        if len(user_data.password) > 72:
            raise ValueError("Password is too long. Please use a password with less than 72 characters.")

        if len(user_data.password) < 8:
            raise ValueError("Password must be at least 8 characters long.")

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
        import re
        db = db_service.get_db()

        # Case-insensitive email lookup so Google's lowercase email matches
        # accounts created with mixed-case emails (or vice versa)
        email = user_info["email"].strip()
        existing = await db[UserRepository.collection_name].find_one(
            {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}}
        )

        if existing:
            # Only set profile_picture from OAuth if the user has none yet
            update_fields: dict = {"last_login": datetime.utcnow()}
            if not existing.get("profile_picture") and user_info.get("profile_picture"):
                update_fields["profile_picture"] = user_info["profile_picture"]

            await db[UserRepository.collection_name].update_one(
                {"_id": existing["_id"]},
                {"$set": update_fields}
            )
            # Return fresh data (merge update_fields into existing before hydrating)
            existing.update(update_fields)
            return UserRepository._hydrate_user(existing)

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
        try:
            user_doc = await db[UserRepository.collection_name].find_one({"email": email})
        except Exception as e:
            # Surface connection issues quickly
            raise RuntimeError(f"Database unavailable: {e}")

        if user_doc:
            return UserRepository._hydrate_user(user_doc)
        return None

    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[User]:
        """Get user by ID"""
        db = db_service.get_db()
        try:
            user_doc = await db[UserRepository.collection_name].find_one(
                {"_id": ObjectId(user_id)}
            )
        except Exception as e:
            raise RuntimeError(f"Database unavailable: {e}")

        if user_doc:
            return UserRepository._hydrate_user(user_doc)
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
    async def update_user_profile(user_id: str, profile_data: UserProfileUpdate) -> Optional[User]:
        """Update user education profile"""
        update_dict = {k: v for k, v in profile_data.dict(exclude_unset=True).items() if v is not None}
        return await UserRepository.update_user(user_id, update_dict)

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

    @staticmethod
    async def set_ai_settings(
        user_id: str,
        provider: Optional[str],
        model: Optional[str],
        encrypted_api_key: Optional[str]
    ) -> Optional[User]:
        """Store AI provider settings (encrypted key)."""
        db = db_service.get_db()
        ai_settings = {
            "provider": provider,
            "model": model,
            "encrypted_api_key": encrypted_api_key,
            "has_api_key": bool(encrypted_api_key),
            "updated_at": datetime.utcnow()
        }
        await db[UserRepository.collection_name].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"ai_settings": ai_settings}}
        )
        return await UserRepository.get_user_by_id(user_id)

    @staticmethod
    async def get_ai_settings(user_id: str) -> Optional[dict]:
        """Get AI settings for a user."""
        db = db_service.get_db()
        user_doc = await db[UserRepository.collection_name].find_one(
            {"_id": ObjectId(user_id)},
            {"ai_settings": 1}
        )
        ai_settings = user_doc.get("ai_settings") if user_doc else None
        if isinstance(ai_settings, dict):
            ai_settings["has_api_key"] = bool(ai_settings.get("encrypted_api_key"))
            return ai_settings
        return None
