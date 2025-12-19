from typing import Optional
from fastapi import Request
from pydantic import BaseModel

from app.core.config import settings
from app.models.user import User
from app.utils.crypto import decrypt_value


class ResolvedAICredentials(BaseModel):
    provider: str
    api_key: Optional[str] = None
    model: Optional[str] = None


def resolve_ai_credentials(request: Request, user: Optional[User] = None) -> ResolvedAICredentials:
    """
    Determine which AI provider/key/model to use for a request.
    Priority:
    1) Per-request headers (X-AI-Provider, X-AI-Key, X-AI-Model)
    2) User's saved credentials (if authenticated)
    3) Default settings
    """
    provider = request.headers.get("x-ai-provider") or request.headers.get("X-AI-Provider")
    api_key = request.headers.get("x-ai-key") or request.headers.get("X-AI-Key")
    model = request.headers.get("x-ai-model") or request.headers.get("X-AI-Model")

    # Use saved user settings if provided
    if user and user.ai_settings:
        if not provider and getattr(user.ai_settings, "provider", None):
            provider = user.ai_settings.provider
        if not model and getattr(user.ai_settings, "model", None):
            model = user.ai_settings.model
        if not api_key:
            encrypted = getattr(user.ai_settings, "encrypted_api_key", None)
            if encrypted:
                api_key = decrypt_value(encrypted)

    provider = provider or settings.DEFAULT_AI_PROVIDER

    return ResolvedAICredentials(
        provider=provider,
        api_key=api_key,
        model=model
    )
