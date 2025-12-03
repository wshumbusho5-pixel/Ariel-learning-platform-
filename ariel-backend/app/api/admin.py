from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import User
from app.models.analytics import DashboardStats, UserStats, UsageMetrics
from app.services.analytics_service import AnalyticsService
from app.services.user_repository import UserRepository
from app.services.auth_service import AuthService
from typing import Optional

router = APIRouter()
security = HTTPBearer()

# Admin role check dependency
async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Verify user is authenticated and has admin role"""
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

    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return user

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(admin: User = Depends(require_admin)):
    """Get dashboard overview statistics"""
    try:
        stats = await AnalyticsService.get_dashboard_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard stats: {str(e)}"
        )

@router.get("/users", response_model=list[UserStats])
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(require_admin)
):
    """Get all users with their statistics"""
    try:
        users = await AnalyticsService.get_all_users(skip=skip, limit=limit)
        return users
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch users: {str(e)}"
        )

@router.get("/users/{user_id}", response_model=UserStats)
async def get_user_details(user_id: str, admin: User = Depends(require_admin)):
    """Get detailed stats for a specific user"""
    try:
        users = await AnalyticsService.get_all_users(skip=0, limit=1000)
        user = next((u for u in users if u.user_id == user_id), None)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user details: {str(e)}"
        )

@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    admin: User = Depends(require_admin)
):
    """Update user properties (role, active status, etc.)"""
    try:
        update_data = {}
        if role is not None:
            if role not in ["user", "premium", "admin"]:
                raise HTTPException(status_code=400, detail="Invalid role")
            update_data["role"] = role

        if is_active is not None:
            update_data["is_active"] = is_active

        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")

        updated_user = await UserRepository.update_user(user_id, update_data)

        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "success": True,
            "message": "User updated successfully",
            "user": {
                "id": updated_user.id,
                "email": updated_user.email,
                "role": updated_user.role,
                "is_active": updated_user.is_active
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update user: {str(e)}"
        )

@router.get("/usage", response_model=UsageMetrics)
async def get_usage_metrics(
    days: int = 7,
    admin: User = Depends(require_admin)
):
    """Get AI usage and cost metrics"""
    try:
        metrics = await AnalyticsService.get_usage_metrics(days=days)
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch usage metrics: {str(e)}"
        )

@router.get("/health")
async def admin_health_check(admin: User = Depends(require_admin)):
    """Health check for admin API (requires admin auth)"""
    return {
        "status": "healthy",
        "admin": admin.email
    }
