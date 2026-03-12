from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserAISettings(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    encrypted_api_key: Optional[str] = Field(default=None, exclude=True)
    has_api_key: bool = False
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(extra="ignore")

class AuthProvider(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"
    GITHUB = "github"

class UserRole(str, Enum):
    USER = "user"
    PREMIUM = "premium"
    ADMIN = "admin"

class EducationLevel(str, Enum):
    HIGH_SCHOOL = "high-school"
    UNIVERSITY = "university"
    PROFESSIONAL = "professional"
    SELF_STUDY = "self-study"

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

    # Education Profile
    education_level: Optional[EducationLevel] = None
    year_level: Optional[str] = None
    subjects: List[str] = []
    learning_goals: List[str] = []
    study_preferences: List[str] = []
    onboarding_completed: bool = False

    # Gamification fields
    total_points: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    level: int = 1

    # Social fields
    followers: List[str] = []  # List of user IDs following this user
    following: List[str] = []  # List of user IDs this user follows
    followers_count: int = 0
    following_count: int = 0
    bio: Optional[str] = None
    is_profile_public: bool = True  # Public profile by default
    school: Optional[str] = None
    courses: List[str] = []  # Course codes like "BIO 101"

    # Metadata
    is_active: bool = True
    is_verified: bool = False
    is_teacher: bool = False  # Teacher verification status
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    last_seen: Optional[datetime] = None  # Updated every ~30s while active
    ai_settings: Optional[UserAISettings] = None

    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "email": "student@example.com",
                "username": "student123",
                "full_name": "John Doe",
                "auth_provider": "email"
            }
        }
    )

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

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    education_level: Optional[EducationLevel] = None
    year_level: Optional[str] = None
    subjects: Optional[List[str]] = None
    learning_goals: Optional[List[str]] = None
    study_preferences: Optional[List[str]] = None
    onboarding_completed: Optional[bool] = None
