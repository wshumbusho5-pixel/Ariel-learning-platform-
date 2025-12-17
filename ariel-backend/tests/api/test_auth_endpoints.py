"""
API tests for authentication endpoints.

Tests FastAPI auth endpoints using TestClient with mongomock database.
"""

import pytest
from fastapi import status


# ===== REGISTER ENDPOINT TESTS =====

@pytest.mark.api
async def test_register_success(client, mock_db):
    """Test successful user registration"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "password123",
            "username": "newuser",
            "full_name": "New User"
        }
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Should return access token
    assert "access_token" in data
    assert data["access_token"] is not None

    # Should return user data
    assert "user" in data
    user = data["user"]
    assert user["email"] == "newuser@example.com"
    assert user["username"] == "newuser"
    assert user["full_name"] == "New User"
    assert user["role"] == "user"
    assert user["total_points"] == 0
    assert user["level"] == 1


@pytest.mark.api
async def test_register_duplicate_email(client, db_with_users):
    """Test registration fails with duplicate email"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",  # Already exists
            "password": "password123",
            "username": "different"
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"].lower()


@pytest.mark.api
async def test_register_password_too_short(client, mock_db):
    """Test registration fails with short password"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "short",  # < 8 characters
            "username": "testuser"
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "at least 8 characters" in response.json()["detail"].lower()


@pytest.mark.api
async def test_register_password_too_long(client, mock_db):
    """Test registration fails with password > 72 bytes"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "a" * 73,  # > 72 bytes
            "username": "testuser"
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "72 bytes" in response.json()["detail"].lower()


@pytest.mark.api
async def test_register_minimal_data(client, mock_db):
    """Test registration with minimal required fields"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "minimal@example.com",
            "password": "password123"
        }
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["user"]["email"] == "minimal@example.com"


@pytest.mark.api
async def test_register_invalid_email(client, mock_db):
    """Test registration fails with invalid email"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "not-an-email",
            "password": "password123"
        }
    )

    # FastAPI/Pydantic validation should catch this
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ===== LOGIN ENDPOINT TESTS =====

@pytest.mark.api
async def test_login_success(client, db_with_users):
    """Test successful login"""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Should return access token
    assert "access_token" in data
    assert data["access_token"] is not None

    # Should return user data
    assert "user" in data
    user = data["user"]
    assert user["email"] == "test@example.com"
    assert user["username"] == "testuser"


@pytest.mark.api
async def test_login_wrong_password(client, db_with_users):
    """Test login fails with wrong password"""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrongpassword"
        }
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.api
async def test_login_nonexistent_user(client, mock_db):
    """Test login fails for nonexistent user"""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "password123"
        }
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.api
async def test_login_oauth_user_fails(client, db_with_users):
    """Test email/password login fails for OAuth users"""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "oauth@example.com",  # OAuth user
            "password": "anypassword"
        }
    )

    # Should fail because OAuth users don't have passwords
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.api
async def test_login_invalid_email_format(client, mock_db):
    """Test login with invalid email format"""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "not-an-email",
            "password": "password123"
        }
    )

    # Pydantic validation should catch this
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ===== OAUTH LOGIN ENDPOINT TESTS =====

@pytest.mark.api
async def test_oauth_login_google_success(client, mock_db, mock_google_oauth):
    """Test successful Google OAuth login"""
    response = client.post(
        "/api/auth/oauth/login",
        json={
            "provider": "google",
            "access_token": "valid-google-token"
        }
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Should return access token
    assert "access_token" in data
    assert data["access_token"] is not None

    # Should return user data
    user = data["user"]
    assert user["email"] == "oauth@google.com"


@pytest.mark.api
async def test_oauth_login_github_success(client, mock_db, mock_github_oauth):
    """Test successful GitHub OAuth login"""
    response = client.post(
        "/api/auth/oauth/login",
        json={
            "provider": "github",
            "access_token": "valid-github-token"
        }
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Should return access token and user data
    assert "access_token" in data
    user = data["user"]
    assert user["email"] == "oauth@github.com"
    assert user["username"] == "githubuser"


@pytest.mark.api
async def test_oauth_login_invalid_provider(client, mock_db):
    """Test OAuth login fails with invalid provider"""
    response = client.post(
        "/api/auth/oauth/login",
        json={
            "provider": "facebook",  # Not supported
            "access_token": "some-token"
        }
    )

    # FastAPI/Pydantic validation should catch this
    assert response.status_code in [
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_422_UNPROCESSABLE_ENTITY
    ]


@pytest.mark.api
async def test_oauth_login_invalid_token(client, respx_mock):
    """Test OAuth login fails with invalid token"""
    from httpx import Response

    # Mock invalid token response
    respx_mock.get("https://www.googleapis.com/oauth2/v2/userinfo").mock(
        return_value=Response(401, json={"error": "Invalid token"})
    )

    response = client.post(
        "/api/auth/oauth/login",
        json={
            "provider": "google",
            "access_token": "invalid-token"
        }
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "invalid" in response.json()["detail"].lower()


@pytest.mark.api
async def test_oauth_login_existing_user(client, db_with_users, mock_google_oauth):
    """Test OAuth login for existing user updates last_login"""
    # First OAuth login creates user
    response1 = client.post(
        "/api/auth/oauth/login",
        json={
            "provider": "google",
            "access_token": "valid-google-token"
        }
    )
    assert response1.status_code == status.HTTP_200_OK

    # Second OAuth login should work (updates last_login)
    response2 = client.post(
        "/api/auth/oauth/login",
        json={
            "provider": "google",
            "access_token": "valid-google-token"
        }
    )
    assert response2.status_code == status.HTTP_200_OK


# ===== GET CURRENT USER (/me) ENDPOINT TESTS =====

@pytest.mark.api
async def test_get_current_user_success(client, db_with_users, auth_headers):
    """Test getting current user with valid token"""
    response = client.get(
        "/api/auth/me",
        headers=auth_headers
    )

    assert response.status_code == status.HTTP_200_OK
    user = response.json()

    assert user["email"] == "test@example.com"
    assert user["username"] == "testuser"
    assert user["id"] is not None


@pytest.mark.api
async def test_get_current_user_no_token(client, mock_db):
    """Test /me endpoint fails without authentication"""
    response = client.get("/api/auth/me")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.api
async def test_get_current_user_invalid_token(client, mock_db):
    """Test /me endpoint fails with invalid token"""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid.token.here"}
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.api
async def test_get_current_user_expired_token(client, db_with_users, expired_token):
    """Test /me endpoint fails with expired token"""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.api
async def test_get_current_user_malformed_header(client, mock_db):
    """Test /me endpoint fails with malformed authorization header"""
    # Missing "Bearer" prefix
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "some-token"}
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


# ===== UPDATE PROFILE ENDPOINT TESTS =====

@pytest.mark.api
async def test_update_profile_success(client, db_with_users, auth_headers):
    """Test successful profile update"""
    response = client.put(
        "/api/auth/profile",
        headers=auth_headers,
        json={
            "education_level": "university",
            "subjects": ["Math", "Physics"],
            "learning_goals": ["Pass exams"]
        }
    )

    assert response.status_code == status.HTTP_200_OK
    user = response.json()

    assert user["education_level"] == "university"
    assert "Math" in user["subjects"]
    assert "Physics" in user["subjects"]


@pytest.mark.api
async def test_update_profile_no_auth(client, mock_db):
    """Test profile update fails without authentication"""
    response = client.put(
        "/api/auth/profile",
        json={
            "education_level": "university"
        }
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.api
async def test_update_profile_partial(client, db_with_users, auth_headers):
    """Test partial profile update (only some fields)"""
    response = client.put(
        "/api/auth/profile",
        headers=auth_headers,
        json={
            "subjects": ["Computer Science"]
        }
    )

    assert response.status_code == status.HTTP_200_OK
    user = response.json()

    assert "Computer Science" in user["subjects"]


# ===== INTEGRATION TESTS =====

@pytest.mark.api
async def test_full_auth_flow(client, mock_db):
    """Test complete authentication flow: register -> login -> access protected route"""
    # Step 1: Register
    register_response = client.post(
        "/api/auth/register",
        json={
            "email": "flowtest@example.com",
            "password": "password123",
            "username": "flowtest"
        }
    )
    assert register_response.status_code == status.HTTP_200_OK
    token1 = register_response.json()["access_token"]

    # Step 2: Access protected route with registration token
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert me_response.status_code == status.HTTP_200_OK

    # Step 3: Login with same credentials
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "flowtest@example.com",
            "password": "password123"
        }
    )
    assert login_response.status_code == status.HTTP_200_OK
    token2 = login_response.json()["access_token"]

    # Step 4: Access protected route with login token
    me_response2 = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert me_response2.status_code == status.HTTP_200_OK
    assert me_response2.json()["email"] == "flowtest@example.com"


@pytest.mark.api
async def test_oauth_and_profile_update_flow(client, mock_db, mock_google_oauth):
    """Test OAuth login followed by profile update"""
    # Step 1: OAuth login
    oauth_response = client.post(
        "/api/auth/oauth/login",
        json={
            "provider": "google",
            "access_token": "valid-google-token"
        }
    )
    assert oauth_response.status_code == status.HTTP_200_OK
    token = oauth_response.json()["access_token"]

    # Step 2: Update profile with OAuth token
    profile_response = client.put(
        "/api/auth/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "education_level": "professional",
            "subjects": ["Data Science"]
        }
    )
    assert profile_response.status_code == status.HTTP_200_OK
    assert profile_response.json()["education_level"] == "professional"
