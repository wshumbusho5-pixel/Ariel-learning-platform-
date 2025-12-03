from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class AuthProvider(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"
    GITHUB = "github"

class UserRole(str, Enum):
    USER = "user"
    PREMIUM = "premium"
    ADMIN = "admin"

class User(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None
    hashed_password: Optional[str] = None  # Only for email auth
    auth_provider: AuthProvider = AuthProvider.EMAIL
    provider_id: Optional[str] = None  # Google/GitHub user ID
    profile_picture: Optional[str] = None
    role: UserRole = UserRole.USER

    # Gamification fields
    total_points: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    level: int = 1

    # Metadata
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "email": "student@example.com",
                "username": "student123",
                "full_name": "John Doe",
                "auth_provider": "email"
            }
        }

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None

class OAuthLoginRequest(BaseModel):
    provider: AuthProvider
    access_token: str  # Token from Google/GitHub OAuth

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str
