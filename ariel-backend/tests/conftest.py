"""
Pytest configuration and fixtures for Ariel backend testing.

This module provides comprehensive test fixtures including:
- Async event loop configuration
- Mongomock database setup
- Authentication fixtures (tokens, headers, users)
- FastAPI test client
- External service mocks (AI providers, OAuth)
- Test data factories
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from bson import ObjectId
from typing import Dict, Any
import respx
from httpx import Response

# Import mongomock-motor for async MongoDB mocking
from mongomock_motor import AsyncMongoMockClient
from fastapi.testclient import TestClient

# Import app components
from app.main import app
from app.services.database_service import db_service
from app.services.auth_service import AuthService
from app.models.user import User, AuthProvider, UserRole


# ===== EVENT LOOP CONFIGURATION =====
@pytest.fixture(scope="session")
def event_loop():
    """
    Create an event loop for the entire test session.
    Required for async tests with pytest-asyncio.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ===== DATABASE FIXTURES =====
@pytest.fixture
async def mock_db():
    """
    Provides a clean mongomock database for each test.
    Uses mongomock-motor for async compatibility with Motor.

    The database is automatically cleaned up after each test.
    """
    # Create mongomock client (async-compatible)
    client = AsyncMongoMockClient()
    database = client["ariel_test_db"]

    # Override the database service to use mock
    # Use class-level attribute to ensure singleton pattern works
    from app.services.database_service import DatabaseService
    original_db = DatabaseService.db
    original_client = DatabaseService.client

    DatabaseService.db = database
    DatabaseService.client = client

    yield database

    # Cleanup: clear all collections
    collection_names = await database.list_collection_names()
    for collection_name in collection_names:
        await database[collection_name].delete_many({})

    # Restore original database
    DatabaseService.db = original_db
    DatabaseService.client = original_client


@pytest.fixture
async def db_with_users(mock_db):
    """
    Database pre-populated with test users.

    Provides:
    - User 1: Email auth user (test@example.com / password123)
    - User 2: OAuth user (Google)
    """
    users_collection = mock_db["users"]

    # Test user 1: Email authentication
    user1_id = ObjectId("507f1f77bcf86cd799439011")
    user1 = {
        "_id": user1_id,
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "hashed_password": AuthService.get_password_hash("password123"),
        "auth_provider": AuthProvider.EMAIL.value,
        "role": UserRole.USER.value,
        "total_points": 100,
        "level": 2,
        "current_streak": 5,
        "longest_streak": 10,
        "cards_mastered": 50,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "is_verified": True,
        "onboarding_completed": True,
    }

    # Test user 2: OAuth (Google) user
    user2_id = ObjectId("507f1f77bcf86cd799439012")
    user2 = {
        "_id": user2_id,
        "email": "oauth@example.com",
        "username": "oauthuser",
        "full_name": "OAuth User",
        "hashed_password": None,
        "auth_provider": AuthProvider.GOOGLE.value,
        "provider_id": "google123",
        "profile_picture": "https://example.com/pic.jpg",
        "role": UserRole.USER.value,
        "total_points": 50,
        "level": 1,
        "current_streak": 0,
        "longest_streak": 0,
        "cards_mastered": 10,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "is_verified": True,
        "onboarding_completed": False,
    }

    await users_collection.insert_many([user1, user2])

    yield mock_db


# ===== AUTHENTICATION FIXTURES =====
@pytest.fixture
def test_user_data() -> Dict[str, Any]:
    """Standard test user data for creating new users."""
    return {
        "email": "test@example.com",
        "password": "password123",
        "username": "testuser",
        "full_name": "Test User"
    }


@pytest.fixture
def test_user() -> User:
    """A test User model instance (not in database)."""
    return User(
        id="507f1f77bcf86cd799439011",
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        auth_provider=AuthProvider.EMAIL,
        role=UserRole.USER,
        total_points=100,
        level=2,
        current_streak=5,
    )


@pytest.fixture
def auth_token(test_user: User) -> str:
    """Valid JWT token for test user."""
    token_data = {
        "sub": test_user.email,
        "user_id": test_user.id,
    }
    return AuthService.create_access_token(token_data)


@pytest.fixture
def auth_headers(auth_token: str) -> Dict[str, str]:
    """Authorization headers with valid Bearer token."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def expired_token(test_user: User) -> str:
    """Expired JWT token for testing token expiration."""
    token_data = {
        "sub": test_user.email,
        "user_id": test_user.id,
    }
    # Create token with negative expiration (already expired)
    return AuthService.create_access_token(
        token_data,
        expires_delta=timedelta(seconds=-1)
    )


# ===== FASTAPI TEST CLIENT =====
@pytest.fixture(scope="function")
def client(request):
    """
    FastAPI TestClient.

    Use alongside mock_db fixture for API endpoint tests.
    The mock_db fixture must be requested in the test to set up the database.

    Example:
        async def test_endpoint(client, mock_db):
            response = client.post("/api/auth/login", json={...})
            assert response.status_code == 200
    """
    # Import TestClient from fastapi.testclient (not starlette)
    from fastapi.testclient import TestClient as FastAPITestClient

    # Create test client - don't use context manager to avoid issues
    test_client = FastAPITestClient(app)
    yield test_client


# ===== EXTERNAL SERVICE MOCKS =====
@pytest.fixture
def mock_openai_response() -> Dict[str, Any]:
    """Mock OpenAI API response structure."""
    return {
        "choices": [{
            "message": {
                "content": '{"answer": "Paris", "explanation": "Paris is the capital and largest city of France."}'
            }
        }],
        "usage": {
            "total_tokens": 50
        }
    }


@pytest.fixture
def mock_anthropic_response():
    """Mock Anthropic Claude API response structure."""
    class MockContent:
        text = '{"answer": "Paris", "explanation": "Paris is the capital and largest city of France."}'

    class MockMessage:
        content = [MockContent()]

    return MockMessage()


@pytest.fixture
def mock_ollama_response() -> Dict[str, Any]:
    """Mock Ollama local model response structure."""
    return {
        "response": '{"answer": "Paris", "explanation": "Paris is the capital and largest city of France."}'
    }


@pytest.fixture
def respx_mock():
    """
    RESPX mock for httpx requests.

    Use this to mock external HTTP/HTTPS requests.
    Automatically cleans up after each test.
    """
    with respx.mock:
        yield respx


@pytest.fixture
def mock_google_oauth(respx_mock):
    """
    Mock Google OAuth verification endpoint.

    Mocks the Google userinfo endpoint to return a test user.
    """
    respx_mock.get("https://www.googleapis.com/oauth2/v2/userinfo").mock(
        return_value=Response(200, json={
            "email": "oauth@google.com",
            "name": "Google User",
            "picture": "https://example.com/pic.jpg",
            "id": "google123",
            "verified_email": True
        })
    )
    yield respx_mock


@pytest.fixture
def mock_github_oauth(respx_mock):
    """
    Mock GitHub OAuth verification endpoints.

    Mocks both the user info and email endpoints.
    """
    # Mock user info endpoint
    respx_mock.get("https://api.github.com/user").mock(
        return_value=Response(200, json={
            "id": 12345,
            "login": "githubuser",
            "name": "GitHub User",
            "avatar_url": "https://example.com/avatar.jpg"
        })
    )

    # Mock user emails endpoint
    respx_mock.get("https://api.github.com/user/emails").mock(
        return_value=Response(200, json=[
            {
                "email": "oauth@github.com",
                "primary": True,
                "verified": True
            }
        ])
    )

    yield respx_mock


@pytest.fixture
def mock_web_scraping(respx_mock):
    """
    Mock web scraping HTTP requests.

    Returns sample HTML content for scraping tests.
    """
    html_content = """
    <html>
        <head><title>Sample Learning Page</title></head>
        <body>
            <h1>Sample Questions</h1>
            <p>1. What is Python?</p>
            <p>2. What is FastAPI?</p>
            <p>3. What is MongoDB?</p>
        </body>
    </html>
    """

    respx_mock.get("https://example.com/test").mock(
        return_value=Response(
            200,
            text=html_content,
            headers={"content-type": "text/html"}
        )
    )

    yield respx_mock


# ===== TEST DATA FACTORIES =====
@pytest.fixture
def card_factory():
    """
    Factory for creating test card data.

    Usage:
        def test_something(card_factory):
            card = card_factory(subject="Math", difficulty="hard")
    """
    def _create_card(**kwargs):
        defaults = {
            "question": "What is 2+2?",
            "answer": "4",
            "subject": "Mathematics",
            "topic": "Arithmetic",
            "tags": ["basic", "addition"],
            "difficulty": "easy",
            "visibility": "private",
        }
        return {**defaults, **kwargs}
    return _create_card


@pytest.fixture
def user_factory():
    """
    Factory for creating test users.

    Auto-increments usernames and emails for uniqueness.

    Usage:
        def test_something(user_factory):
            user1 = user_factory()
            user2 = user_factory(role="admin")
    """
    counter = 0

    def _create_user(**kwargs):
        nonlocal counter
        counter += 1
        defaults = {
            "email": f"user{counter}@example.com",
            "username": f"user{counter}",
            "full_name": f"Test User {counter}",
            "hashed_password": AuthService.get_password_hash("password123"),
            "auth_provider": AuthProvider.EMAIL.value,
            "role": UserRole.USER.value,
            "total_points": 0,
            "level": 1,
            "current_streak": 0,
            "longest_streak": 0,
            "cards_mastered": 0,
            "created_at": datetime.utcnow(),
            "is_active": True,
            "is_verified": False,
            "onboarding_completed": False,
        }
        return {**defaults, **kwargs}

    return _create_user


@pytest.fixture
def progress_factory():
    """Factory for creating card progress/review data."""
    def _create_progress(**kwargs):
        defaults = {
            "user_id": "507f1f77bcf86cd799439011",
            "card_id": ObjectId(),
            "repetitions": 0,
            "easiness_factor": 2.5,
            "interval_days": 0,
            "next_review_date": datetime.utcnow(),
            "last_reviewed": None,
            "total_reviews": 0,
        }
        return {**defaults, **kwargs}
    return _create_progress
