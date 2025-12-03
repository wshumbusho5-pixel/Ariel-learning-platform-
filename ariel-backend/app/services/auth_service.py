from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.models.user import User, TokenData
import httpx

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Optional[TokenData]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            user_id: str = payload.get("user_id")
            if email is None:
                return None
            return TokenData(email=email, user_id=user_id)
        except JWTError:
            return None

    @staticmethod
    async def verify_google_token(access_token: str) -> Optional[dict]:
        """Verify Google OAuth token and get user info"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if response.status_code == 200:
                    user_info = response.json()
                    return {
                        "email": user_info.get("email"),
                        "full_name": user_info.get("name"),
                        "profile_picture": user_info.get("picture"),
                        "provider_id": user_info.get("id"),
                        "is_verified": user_info.get("verified_email", False)
                    }
        except Exception as e:
            print(f"Google OAuth error: {e}")
            return None

    @staticmethod
    async def verify_github_token(access_token: str) -> Optional[dict]:
        """Verify GitHub OAuth token and get user info"""
        try:
            async with httpx.AsyncClient() as client:
                # Get user info
                response = await client.get(
                    "https://api.github.com/user",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/vnd.github.v3+json"
                    }
                )
                if response.status_code == 200:
                    user_info = response.json()

                    # Get primary email
                    email_response = await client.get(
                        "https://api.github.com/user/emails",
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Accept": "application/vnd.github.v3+json"
                        }
                    )

                    email = None
                    if email_response.status_code == 200:
                        emails = email_response.json()
                        primary_email = next((e for e in emails if e.get("primary")), None)
                        email = primary_email.get("email") if primary_email else emails[0].get("email")

                    return {
                        "email": email,
                        "full_name": user_info.get("name"),
                        "username": user_info.get("login"),
                        "profile_picture": user_info.get("avatar_url"),
                        "provider_id": str(user_info.get("id")),
                        "is_verified": True
                    }
        except Exception as e:
            print(f"GitHub OAuth error: {e}")
            return None

    @staticmethod
    def create_user_token(user: User) -> str:
        """Create JWT token for a user"""
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = AuthService.create_access_token(
            data={"sub": user.email, "user_id": str(user.id)},
            expires_delta=access_token_expires
        )
        return access_token
