"""
Integration tests for UserRepository.

Tests user CRUD operations, authentication, and AI settings with mongomock database.
"""

import pytest
from datetime import datetime
from bson import ObjectId

from app.services.user_repository import UserRepository
from app.models.user import UserCreate, AuthProvider, UserProfileUpdate


# ===== USER CREATION TESTS =====

@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_user_success(mock_db):
    """Test successful user creation with email/password"""
    user_data = UserCreate(
        email="newuser@example.com",
        password="securepass123",
        username="newuser",
        full_name="New User"
    )

    user = await UserRepository.create_user(user_data)

    # Verify user object
    assert user.id is not None
    assert user.email == "newuser@example.com"
    assert user.username == "newuser"
    assert user.full_name == "New User"
    assert user.auth_provider == AuthProvider.EMAIL
    assert user.hashed_password is not None
    assert user.hashed_password != "securepass123"  # Should be hashed
    assert user.role == "user"
    assert user.total_points == 0
    assert user.level == 1
    assert user.current_streak == 0
    assert user.is_active is True
    assert user.is_verified is False

    # Verify in database
    db_user = await mock_db["users"].find_one({"email": "newuser@example.com"})
    assert db_user is not None
    assert db_user["username"] == "newuser"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_user_duplicate_email(mock_db, user_factory):
    """Test user creation fails with duplicate email"""
    # Create first user
    existing_user = user_factory(email="duplicate@example.com")
    await mock_db["users"].insert_one(existing_user)

    # Try to create another user with same email
    user_data = UserCreate(
        email="duplicate@example.com",
        password="password123",
        username="different"
    )

    with pytest.raises(ValueError, match="User with this email already exists"):
        await UserRepository.create_user(user_data)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_user_password_too_short(mock_db):
    """Test user creation fails with password < 8 characters"""
    user_data = UserCreate(
        email="test@example.com",
        password="short",  # Only 5 characters
        username="testuser"
    )

    with pytest.raises(ValueError, match="Password must be at least 8 characters"):
        await UserRepository.create_user(user_data)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_user_password_too_long(mock_db):
    """Test user creation fails with password > 72 characters"""
    user_data = UserCreate(
        email="test@example.com",
        password="a" * 73,  # 73 characters
        username="testuser"
    )

    with pytest.raises(ValueError, match="Password is too long"):
        await UserRepository.create_user(user_data)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_user_minimal_data(mock_db):
    """Test user creation with minimal required data"""
    user_data = UserCreate(
        email="minimal@example.com",
        password="password123"
    )

    user = await UserRepository.create_user(user_data)

    assert user.email == "minimal@example.com"
    assert user.username is None
    assert user.full_name is None


# ===== OAUTH USER CREATION TESTS =====

@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_oauth_user_new(mock_db):
    """Test creating new user from OAuth provider"""
    user_info = {
        "email": "oauth@google.com",
        "username": "oauthuser",
        "full_name": "OAuth User",
        "provider_id": "google123",
        "profile_picture": "https://example.com/pic.jpg",
        "is_verified": True
    }

    user = await UserRepository.create_oauth_user(user_info, AuthProvider.GOOGLE)

    # Verify user object
    assert user.id is not None
    assert user.email == "oauth@google.com"
    assert user.username == "oauthuser"
    assert user.auth_provider == AuthProvider.GOOGLE
    assert user.provider_id == "google123"
    assert user.hashed_password is None  # OAuth users have no password
    assert user.is_verified is True
    assert user.last_login is not None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_oauth_user_existing(mock_db, user_factory):
    """Test OAuth login for existing user (updates login time)"""
    # Create existing user
    existing_user = user_factory(
        email="existing@example.com",
        profile_picture=None
    )
    await mock_db["users"].insert_one(existing_user)

    user_info = {
        "email": "existing@example.com",
        "full_name": "Updated Name",
        "profile_picture": "https://example.com/new-pic.jpg",
    }

    user = await UserRepository.create_oauth_user(user_info, AuthProvider.GOOGLE)

    # Should return existing user
    assert user.email == "existing@example.com"

    # Verify last_login was updated in database
    db_user = await mock_db["users"].find_one({"email": "existing@example.com"})
    assert db_user["last_login"] is not None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_oauth_user_github(mock_db):
    """Test creating user from GitHub OAuth"""
    user_info = {
        "email": "github@example.com",
        "username": "githubuser",
        "full_name": "GitHub User",
        "provider_id": "github456",
        "profile_picture": "https://github.com/avatar.jpg",
        "is_verified": True
    }

    user = await UserRepository.create_oauth_user(user_info, AuthProvider.GITHUB)

    assert user.auth_provider == AuthProvider.GITHUB
    assert user.provider_id == "github456"


# ===== GET USER TESTS =====

@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_user_by_email_exists(db_with_users):
    """Test getting user by email when user exists"""
    user = await UserRepository.get_user_by_email("test@example.com")

    assert user is not None
    assert user.email == "test@example.com"
    assert user.username == "testuser"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_user_by_email_not_exists(mock_db):
    """Test getting user by email when user doesn't exist"""
    user = await UserRepository.get_user_by_email("nonexistent@example.com")

    assert user is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_user_by_id_exists(db_with_users):
    """Test getting user by ID when user exists"""
    user_id = "507f1f77bcf86cd799439011"
    user = await UserRepository.get_user_by_id(user_id)

    assert user is not None
    assert user.id == user_id
    assert user.email == "test@example.com"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_user_by_id_not_exists(mock_db):
    """Test getting user by ID when user doesn't exist"""
    fake_id = str(ObjectId())
    user = await UserRepository.get_user_by_id(fake_id)

    assert user is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_user_by_id_invalid_objectid(mock_db):
    """Test getting user with invalid ObjectId format"""
    with pytest.raises(Exception):  # Should raise an error for invalid ObjectId
        await UserRepository.get_user_by_id("invalid-id")


# ===== UPDATE USER TESTS =====

@pytest.mark.integration
@pytest.mark.asyncio
async def test_update_user(db_with_users):
    """Test updating user fields"""
    user_id = "507f1f77bcf86cd799439011"

    update_data = {
        "full_name": "Updated Name",
        "total_points": 500,
        "level": 5
    }

    updated_user = await UserRepository.update_user(user_id, update_data)

    assert updated_user is not None
    assert updated_user.full_name == "Updated Name"
    assert updated_user.total_points == 500
    assert updated_user.level == 5
    # Email should remain unchanged
    assert updated_user.email == "test@example.com"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_update_user_profile(db_with_users):
    """Test updating user profile with UserProfileUpdate model"""
    user_id = "507f1f77bcf86cd799439011"

    profile_data = UserProfileUpdate(
        education_level="university",
        subjects=["Math", "Physics"],
        learning_goals=["Pass exams", "Master calculus"]
    )

    updated_user = await UserRepository.update_user_profile(user_id, profile_data)

    assert updated_user is not None
    assert updated_user.education_level == "university"
    assert "Math" in updated_user.subjects
    assert "Physics" in updated_user.subjects


# ===== AUTHENTICATION TESTS =====

@pytest.mark.integration
@pytest.mark.asyncio
async def test_authenticate_user_success(db_with_users):
    """Test successful user authentication"""
    user = await UserRepository.authenticate_user("test@example.com", "password123")

    assert user is not None
    assert user.email == "test@example.com"
    assert user.last_login is not None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_authenticate_user_wrong_password(db_with_users):
    """Test authentication fails with wrong password"""
    user = await UserRepository.authenticate_user("test@example.com", "wrongpassword")

    assert user is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_authenticate_user_nonexistent(mock_db):
    """Test authentication fails for nonexistent user"""
    user = await UserRepository.authenticate_user("nonexistent@example.com", "password")

    assert user is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_authenticate_oauth_user_fails(db_with_users):
    """Test authentication fails for OAuth users (no password)"""
    # Try to authenticate OAuth user with password
    user = await UserRepository.authenticate_user("oauth@example.com", "anypassword")

    # Should fail because OAuth users can't authenticate with password
    assert user is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_authenticate_updates_last_login(db_with_users, mock_db):
    """Test that authentication updates last_login timestamp"""
    # Get user before authentication
    user_before = await mock_db["users"].find_one({"email": "test@example.com"})
    original_login = user_before.get("last_login")

    # Authenticate
    user = await UserRepository.authenticate_user("test@example.com", "password123")

    # Verify last_login was updated
    assert user.last_login is not None
    if original_login:
        assert user.last_login != original_login


# ===== AI SETTINGS TESTS =====

@pytest.mark.integration
@pytest.mark.asyncio
async def test_set_ai_settings(db_with_users):
    """Test setting AI provider settings"""
    user_id = "507f1f77bcf86cd799439011"

    updated_user = await UserRepository.set_ai_settings(
        user_id=user_id,
        provider="openai",
        model="gpt-4",
        encrypted_api_key="encrypted_key_123"
    )

    assert updated_user is not None
    assert updated_user.ai_settings is not None
    assert updated_user.ai_settings.provider == "openai"
    assert updated_user.ai_settings.model == "gpt-4"
    assert updated_user.ai_settings.has_api_key is True


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_ai_settings(db_with_users):
    """Test retrieving AI settings"""
    user_id = "507f1f77bcf86cd799439011"

    # Set AI settings first
    await UserRepository.set_ai_settings(
        user_id=user_id,
        provider="anthropic",
        model="claude-3",
        encrypted_api_key="encrypted_key_456"
    )

    # Get AI settings
    ai_settings = await UserRepository.get_ai_settings(user_id)

    assert ai_settings is not None
    assert ai_settings["provider"] == "anthropic"
    assert ai_settings["model"] == "claude-3"
    assert ai_settings["has_api_key"] is True
    assert ai_settings["encrypted_api_key"] == "encrypted_key_456"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_ai_settings_none(db_with_users):
    """Test getting AI settings when none are set"""
    user_id = "507f1f77bcf86cd799439011"

    ai_settings = await UserRepository.get_ai_settings(user_id)

    # Should return None if no settings exist
    assert ai_settings is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_set_ai_settings_without_key(db_with_users):
    """Test setting AI provider without API key"""
    user_id = "507f1f77bcf86cd799439011"

    updated_user = await UserRepository.set_ai_settings(
        user_id=user_id,
        provider="ollama",
        model="llama3",
        encrypted_api_key=None  # No API key for local model
    )

    assert updated_user.ai_settings.provider == "ollama"
    assert updated_user.ai_settings.has_api_key is False


# ===== HYDRATION TESTS =====

@pytest.mark.integration
@pytest.mark.asyncio
async def test_user_hydration_with_ai_settings(mock_db):
    """Test _hydrate_user correctly processes AI settings"""
    user_id = ObjectId()
    user_doc = {
        "_id": user_id,
        "email": "test@example.com",
        "username": "testuser",
        "auth_provider": AuthProvider.EMAIL.value,
        "role": "user",
        "total_points": 0,
        "level": 1,
        "current_streak": 0,
        "ai_settings": {
            "provider": "openai",
            "encrypted_api_key": "encrypted_key"
        }
    }

    await mock_db["users"].insert_one(user_doc)

    user = await UserRepository.get_user_by_id(str(user_id))

    assert user.ai_settings is not None
    assert user.ai_settings.has_api_key is True
    assert user.ai_settings.provider == "openai"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_user_hydration_without_ai_settings(mock_db):
    """Test _hydrate_user works when AI settings are missing"""
    user_id = ObjectId()
    user_doc = {
        "_id": user_id,
        "email": "test@example.com",
        "username": "testuser",
        "auth_provider": AuthProvider.EMAIL.value,
        "role": "user",
        "total_points": 0,
        "level": 1,
        "current_streak": 0
    }

    await mock_db["users"].insert_one(user_doc)

    user = await UserRepository.get_user_by_id(str(user_id))

    # Should handle missing AI settings gracefully
    assert user is not None
    assert user.email == "test@example.com"
