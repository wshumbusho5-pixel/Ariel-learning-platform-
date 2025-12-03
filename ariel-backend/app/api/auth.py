from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import (
    UserCreate, UserLogin, Token, User, OAuthLoginRequest, AuthProvider
)
from app.services.user_repository import UserRepository
from app.services.auth_service import AuthService

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user with email and password"""
    try:
        user = await UserRepository.create_user(user_data)
        access_token = AuthService.create_user_token(user)

        return Token(
            access_token=access_token,
            user={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "profile_picture": user.profile_picture,
                "role": user.role,
                "total_points": user.total_points,
                "level": user.level,
                "current_streak": user.current_streak
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login with email and password"""
    user = await UserRepository.authenticate_user(credentials.email, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = AuthService.create_user_token(user)

    return Token(
        access_token=access_token,
        user={
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "profile_picture": user.profile_picture,
            "role": user.role,
            "total_points": user.total_points,
            "level": user.level,
            "current_streak": user.current_streak
        }
    )

@router.post("/oauth/login", response_model=Token)
async def oauth_login(oauth_request: OAuthLoginRequest):
    """Login or register with OAuth (Google/GitHub)"""
    try:
        # Verify token with provider
        if oauth_request.provider == AuthProvider.GOOGLE:
            user_info = await AuthService.verify_google_token(oauth_request.access_token)
        elif oauth_request.provider == AuthProvider.GITHUB:
            user_info = await AuthService.verify_github_token(oauth_request.access_token)
        else:
            raise HTTPException(status_code=400, detail="Invalid OAuth provider")

        if not user_info:
            raise HTTPException(status_code=401, detail="Invalid OAuth token")

        # Create or get user
        user = await UserRepository.create_oauth_user(user_info, oauth_request.provider)
        access_token = AuthService.create_user_token(user)

        return Token(
            access_token=access_token,
            user={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "profile_picture": user.profile_picture,
                "role": user.role,
                "total_points": user.total_points,
                "level": user.level,
                "current_streak": user.current_streak
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth login failed: {str(e)}")

@router.get("/me", response_model=User)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    token = credentials.credentials
    token_data = AuthService.verify_token(token)

    if not token_data or not token_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user = await UserRepository.get_user_by_id(token_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

# Dependency to get current user
async def get_current_user_dependency(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Dependency to get current user from token"""
    token = credentials.credentials
    token_data = AuthService.verify_token(token)

    if not token_data or not token_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user = await UserRepository.get_user_by_id(token_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
