"""
Unit tests for AuthService.

Tests password hashing, JWT token creation/verification, and OAuth provider verification.
"""

import pytest
from datetime import timedelta
from unittest.mock import AsyncMock, patch

from app.services.auth_service import AuthService
from app.models.user import User, TokenData, AuthProvider, UserRole


# ===== PASSWORD HASHING TESTS =====

@pytest.mark.unit
def test_get_password_hash():
    """Test password hashing creates a bcrypt hash"""
    password = "mysecretpassword123"
    hashed = AuthService.get_password_hash(password)

    # Hash should be different from original password
    assert hashed != password

    # Hash should be a string
    assert isinstance(hashed, str)

    # Bcrypt hashes are typically 60 characters
    assert len(hashed) == 60


@pytest.mark.unit
def test_get_password_hash_produces_different_hashes():
    """Test that same password produces different hashes (due to random salt)"""
    password = "samepassword"
    hash1 = AuthService.get_password_hash(password)
    hash2 = AuthService.get_password_hash(password)

    # Hashes should be different due to random salt
    assert hash1 != hash2


@pytest.mark.unit
def test_verify_password_correct():
    """Test password verification with correct password"""
    password = "correctpassword"
    hashed = AuthService.get_password_hash(password)

    # Verification should succeed
    assert AuthService.verify_password(password, hashed) is True


@pytest.mark.unit
def test_verify_password_incorrect():
    """Test password verification with incorrect password"""
    correct_password = "correctpassword"
    wrong_password = "wrongpassword"
    hashed = AuthService.get_password_hash(correct_password)

    # Verification should fail
    assert AuthService.verify_password(wrong_password, hashed) is False


@pytest.mark.unit
def test_verify_password_empty():
    """Test password verification with empty password"""
    password = "nonempty"
    hashed = AuthService.get_password_hash(password)

    # Empty password should not match
    assert AuthService.verify_password("", hashed) is False


# ===== JWT TOKEN TESTS =====

@pytest.mark.unit
def test_create_access_token_default_expiration():
    """Test JWT token creation with default expiration"""
    data = {
        "sub": "test@example.com",
        "user_id": "12345"
    }

    token = AuthService.create_access_token(data)

    # Token should be a string
    assert isinstance(token, str)

    # Token should have 3 parts separated by dots (header.payload.signature)
    assert len(token.split('.')) == 3


@pytest.mark.unit
def test_create_access_token_custom_expiration():
    """Test JWT token creation with custom expiration"""
    data = {"sub": "test@example.com"}
    expires_delta = timedelta(hours=1)

    token = AuthService.create_access_token(data, expires_delta)

    # Token should be created
    assert token is not None
    assert isinstance(token, str)


@pytest.mark.unit
def test_verify_token_valid():
    """Test JWT token verification with valid token"""
    email = "test@example.com"
    user_id = "user123"
    data = {
        "sub": email,
        "user_id": user_id
    }

    token = AuthService.create_access_token(data)
    token_data = AuthService.verify_token(token)

    # Verification should succeed
    assert token_data is not None
    assert isinstance(token_data, TokenData)
    assert token_data.email == email
    assert token_data.user_id == user_id


@pytest.mark.unit
def test_verify_token_invalid():
    """Test JWT token verification with invalid token"""
    invalid_token = "invalid.token.here"

    token_data = AuthService.verify_token(invalid_token)

    # Verification should fail
    assert token_data is None


@pytest.mark.unit
def test_verify_token_expired():
    """Test JWT token verification with expired token"""
    data = {"sub": "test@example.com", "user_id": "123"}
    # Create token that expired 1 hour ago
    token = AuthService.create_access_token(
        data,
        expires_delta=timedelta(hours=-1)
    )

    token_data = AuthService.verify_token(token)

    # Verification should fail for expired token
    assert token_data is None


@pytest.mark.unit
def test_verify_token_missing_email():
    """Test JWT token verification with missing email (sub) field"""
    data = {"user_id": "123"}  # Missing 'sub' (email)
    token = AuthService.create_access_token(data)

    token_data = AuthService.verify_token(token)

    # Should return None when email is missing
    assert token_data is None


@pytest.mark.unit
def test_verify_token_malformed():
    """Test JWT token verification with malformed token"""
    malformed_tokens = [
        "",  # Empty string
        "not.a.token",  # Invalid structure
        "header.payload",  # Missing signature
        "a" * 100,  # Random string
    ]

    for malformed_token in malformed_tokens:
        token_data = AuthService.verify_token(malformed_token)
        assert token_data is None, f"Should reject malformed token: {malformed_token}"


@pytest.mark.unit
def test_create_user_token():
    """Test creating a JWT token from a User model"""
    user = User(
        id="user123",
        email="user@example.com",
        username="testuser",
        auth_provider=AuthProvider.EMAIL,
        role=UserRole.USER,
        total_points=0,
        level=1,
        current_streak=0
    )

    token = AuthService.create_user_token(user)

    # Token should be created
    assert token is not None
    assert isinstance(token, str)

    # Verify token contains correct user data
    token_data = AuthService.verify_token(token)
    assert token_data is not None
    assert token_data.email == user.email
    assert token_data.user_id == str(user.id)


# ===== GOOGLE OAUTH TESTS =====

@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_google_token_success(mock_google_oauth):
    """Test Google OAuth token verification with valid token"""
    access_token = "valid-google-token"

    user_info = await AuthService.verify_google_token(access_token)

    # Should return user info
    assert user_info is not None
    assert user_info["email"] == "oauth@google.com"
    assert user_info["full_name"] == "Google User"
    assert user_info["provider_id"] == "google123"
    assert user_info["is_verified"] is True
    assert "profile_picture" in user_info


@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_google_token_invalid(respx_mock):
    """Test Google OAuth token verification with invalid token"""
    from httpx import Response

    # Mock 401 Unauthorized response
    respx_mock.get("https://www.googleapis.com/oauth2/v2/userinfo").mock(
        return_value=Response(401, json={"error": "Invalid token"})
    )

    user_info = await AuthService.verify_google_token("invalid-token")

    # Should return None for invalid token
    assert user_info is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_google_token_network_error():
    """Test Google OAuth verification handles network errors"""
    with patch("httpx.AsyncClient") as mock_client:
        # Mock network error
        mock_instance = mock_client.return_value.__aenter__.return_value
        mock_instance.get = AsyncMock(side_effect=Exception("Network error"))

        user_info = await AuthService.verify_google_token("some-token")

        # Should return None on exception
        assert user_info is None


# ===== GITHUB OAUTH TESTS =====

@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_github_token_success(mock_github_oauth):
    """Test GitHub OAuth token verification with valid token"""
    access_token = "valid-github-token"

    user_info = await AuthService.verify_github_token(access_token)

    # Should return user info
    assert user_info is not None
    assert user_info["email"] == "oauth@github.com"
    assert user_info["username"] == "githubuser"
    assert user_info["full_name"] == "GitHub User"
    assert user_info["provider_id"] == "12345"
    assert user_info["is_verified"] is True
    assert "profile_picture" in user_info


@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_github_token_invalid(respx_mock):
    """Test GitHub OAuth token verification with invalid token"""
    from httpx import Response

    # Mock 401 Unauthorized response
    respx_mock.get("https://api.github.com/user").mock(
        return_value=Response(401, json={"error": "Bad credentials"})
    )

    user_info = await AuthService.verify_github_token("invalid-token")

    # Should return None for invalid token
    assert user_info is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_github_token_no_primary_email(respx_mock):
    """Test GitHub OAuth when user has no primary email"""
    from httpx import Response

    # Mock user info
    respx_mock.get("https://api.github.com/user").mock(
        return_value=Response(200, json={
            "id": 12345,
            "login": "githubuser",
            "name": "GitHub User",
            "avatar_url": "https://example.com/avatar.jpg"
        })
    )

    # Mock emails without primary flag
    respx_mock.get("https://api.github.com/user/emails").mock(
        return_value=Response(200, json=[
            {"email": "email1@example.com", "verified": True},
            {"email": "email2@example.com", "verified": True}
        ])
    )

    user_info = await AuthService.verify_github_token("valid-token")

    # Should use first email when no primary
    assert user_info is not None
    assert user_info["email"] == "email1@example.com"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_github_token_network_error():
    """Test GitHub OAuth verification handles network errors"""
    with patch("httpx.AsyncClient") as mock_client:
        # Mock network error
        mock_instance = mock_client.return_value.__aenter__.return_value
        mock_instance.get = AsyncMock(side_effect=Exception("Network error"))

        user_info = await AuthService.verify_github_token("some-token")

        # Should return None on exception
        assert user_info is None


# ===== EDGE CASES =====

@pytest.mark.unit
def test_password_with_special_characters():
    """Test password hashing with special characters"""
    password = "P@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?/~`"
    hashed = AuthService.get_password_hash(password)

    # Should handle special characters correctly
    assert AuthService.verify_password(password, hashed) is True


@pytest.mark.unit
def test_password_with_unicode():
    """Test password hashing with Unicode characters"""
    password = "pässwörd123🔒"
    hashed = AuthService.get_password_hash(password)

    # Should handle Unicode correctly
    assert AuthService.verify_password(password, hashed) is True


@pytest.mark.unit
def test_very_long_password():
    """Test password hashing with very long password (>72 bytes raises ValueError)"""
    # Bcrypt has a 72-byte limit and raises ValueError for longer passwords
    password = "a" * 100  # 100 bytes > 72 bytes

    with pytest.raises(ValueError, match="password cannot be longer than 72 bytes"):
        AuthService.get_password_hash(password)


@pytest.mark.unit
def test_jwt_token_roundtrip():
    """Test complete JWT token creation and verification roundtrip"""
    original_data = {
        "sub": "user@example.com",
        "user_id": "abc123",
        "custom_field": "custom_value"
    }

    # Create token
    token = AuthService.create_access_token(original_data)

    # Verify token
    token_data = AuthService.verify_token(token)

    # Should preserve email and user_id
    assert token_data.email == original_data["sub"]
    assert token_data.user_id == original_data["user_id"]
