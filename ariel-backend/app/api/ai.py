from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class AIProvider(BaseModel):
    name: str
    available: bool
    description: str

@router.get("/providers")
async def get_available_providers():
    """
    List available AI providers
    """
    from app.core.config import settings

    providers = [
        {
            "name": "openai",
            "available": bool(settings.OPENAI_API_KEY),
            "description": "OpenAI GPT-4 - Most capable, great for complex questions"
        },
        {
            "name": "anthropic",
            "available": bool(settings.ANTHROPIC_API_KEY),
            "description": "Anthropic Claude - Excellent reasoning and longer context"
        },
        {
            "name": "ollama",
            "available": True,
            "description": "Open source models - Free, runs locally"
        }
    ]

    return {
        "providers": providers,
        "default": settings.DEFAULT_AI_PROVIDER
    }
