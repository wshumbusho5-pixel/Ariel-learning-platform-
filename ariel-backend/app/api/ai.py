from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.services.ai_service import AIService
from app.core.config import settings
from app.api.auth import get_current_user_dependency, get_optional_user_dependency
from app.services.user_repository import UserRepository
from app.utils.crypto import encrypt_value
from app.utils.ai_credentials import resolve_ai_credentials, ResolvedAICredentials

router = APIRouter()

class AIProvider(BaseModel):
    name: str
    available: bool
    description: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None

class ChatCard(BaseModel):
    question: str
    answer: str
    explanation: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    cards: Optional[List[ChatCard]] = None


class AICredentialResponse(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    has_api_key: bool = False
    updated_at: Optional[datetime] = None


class AICredentialUpdate(BaseModel):
    provider: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None
    remove_key: bool = False

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

class CompleteRequest(BaseModel):
    prompt: str
    provider: Optional[str] = None
    model: Optional[str] = None


@router.post("/complete")
async def complete(
    request: CompleteRequest,
    raw_request: Request,
    current_user=Depends(get_optional_user_dependency)
):
    """
    Raw completion endpoint for structured JSON outputs (cram plans, reports, etc.).
    Passes the prompt directly to the model without chat framing.
    """
    try:
        creds: ResolvedAICredentials = resolve_ai_credentials(raw_request, current_user)
        provider = request.provider or creds.provider or settings.DEFAULT_AI_PROVIDER
        model = request.model or creds.model

        ai = AIService(provider=provider, api_key=creds.api_key, model=model)
        result = await ai._ollama_generate(request.prompt)

        reply = ""
        if isinstance(result, dict):
            import json
            reply = json.dumps(result)
        else:
            reply = str(result)

        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    raw_request: Request,
    current_user = Depends(get_optional_user_dependency)
):
    """
    Lightweight chat endpoint for Ariel Assistant.
    Uses configured AI provider (defaults to settings.DEFAULT_AI_PROVIDER).
    """
    try:
        creds: ResolvedAICredentials = resolve_ai_credentials(raw_request, current_user)
        if request.provider:
            creds.provider = request.provider
        if request.model:
            creds.model = request.model

        ai = AIService(provider=creds.provider or settings.DEFAULT_AI_PROVIDER, api_key=creds.api_key, model=creds.model)
        # Keep response concise and encouraging
        system_context = (
            "You are Ariel, a friendly, concise study tutor. "
            "You NEVER recommend other apps or tools; you help directly. "
            "If the user asks to create flashcards, either ask for the subject/notes or generate a small set of flashcards yourself. "
            "Keep answers under 80 words when possible. Be positive and encouraging. "
            "Respond ONLY with JSON in this shape: "
            "{\"answer\": \"your concise reply\", \"cards\": [{\"question\": \"q\", \"answer\": \"a\", \"explanation\": \"brief why\"}]} "
            "Include 'cards' only when you create them."
        )
        prompt = f"{system_context}\n\nUser: {request.message}"
        if request.context:
            prompt += f"\nContext: {request.context}"

        result = await ai._ollama_generate(prompt) if ai.provider == "ollama" else await ai.generate_answer(
            question=request.message,
            context=request.context,
            include_explanation=False
        )

        reply = None
        cards = None
        if isinstance(result, dict):
            reply = (
                result.get("answer")
                or result.get("reply")
                or result.get("message")
                or result.get("response")
            )
            if "cards" in result and isinstance(result["cards"], list):
                cards = []
                for c in result["cards"]:
                    if isinstance(c, dict) and c.get("question") and c.get("answer"):
                        cards.append(ChatCard(
                            question=c["question"],
                            answer=c["answer"],
                            explanation=c.get("explanation")
                        ))
            # If reply absent but cards exist, craft a short reply
            if not reply and cards:
                reply = "Here are some flashcards I generated."
        if not reply and isinstance(result, str):
            reply = result
        if not reply:
            reply = "I'm here to help! Let's try rephrasing that question."

        return ChatResponse(reply=reply, cards=cards)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.get("/credentials", response_model=AICredentialResponse)
async def get_ai_credentials(current_user=Depends(get_current_user_dependency)):
    """Return saved AI provider settings for the authenticated user (without the raw key)."""
    ai_settings = getattr(current_user, "ai_settings", None)
    return {
        "provider": getattr(ai_settings, "provider", None) if ai_settings else None,
        "model": getattr(ai_settings, "model", None) if ai_settings else None,
        "has_api_key": bool(getattr(ai_settings, "encrypted_api_key", None)) if ai_settings else False,
        "updated_at": getattr(ai_settings, "updated_at", None) if ai_settings else None
    }


class CaptionRequest(BaseModel):
    question: str
    answer: str
    subject: Optional[str] = None
    topic: Optional[str] = None

@router.post("/caption")
async def generate_caption(
    request: CaptionRequest,
    raw_request: Request,
    current_user=Depends(get_current_user_dependency)
):
    """Generate a short, personal social caption for a flashcard being posted publicly."""
    try:
        creds: ResolvedAICredentials = resolve_ai_credentials(raw_request, current_user)
        provider = creds.provider or settings.DEFAULT_AI_PROVIDER
        ai = AIService(provider=provider, api_key=creds.api_key, model=creds.model)

        context_parts = []
        if request.subject: context_parts.append(f"Subject: {request.subject}")
        if request.topic: context_parts.append(f"Topic: {request.topic}")
        context_parts.append(f"Question: {request.question}")
        context_parts.append(f"Answer: {request.answer}")
        context_str = "\n".join(context_parts)

        prompt = (
            "You are writing a short, personal social media caption for a study flashcard being shared on a learning platform. "
            "Write exactly ONE caption (max 120 characters). "
            "Make it feel authentic — like a real student sharing something they studied. "
            "Reference the subject or topic naturally. Use 1 relevant emoji. No hashtags. No quotes. Just the caption text.\n\n"
            f"{context_str}\n\nCaption:"
        )

        if provider == "ollama":
            result = await ai._ollama_generate(prompt)
        else:
            result = await ai.generate_answer(question=prompt, context=None, include_explanation=False)

        caption = ""
        if isinstance(result, dict):
            caption = result.get("answer") or result.get("reply") or result.get("response") or ""
        elif isinstance(result, str):
            caption = result

        # Clean up — strip quotes, trim whitespace
        caption = caption.strip().strip('"').strip("'").strip()
        if len(caption) > 160:
            caption = caption[:157] + "..."

        return {"caption": caption}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/credentials", response_model=AICredentialResponse)
async def save_ai_credentials(
    update: AICredentialUpdate,
    current_user=Depends(get_current_user_dependency)
):
    """Save AI provider settings with encrypted API key."""
    try:
        provider = update.provider or (current_user.ai_settings.provider if current_user.ai_settings else None)
        model = update.model or (current_user.ai_settings.model if current_user.ai_settings else None)

        encrypted_api_key = None
        if update.remove_key:
            encrypted_api_key = None
        elif update.api_key:
            encrypted_api_key = encrypt_value(update.api_key)

        user = await UserRepository.set_ai_settings(
            current_user.id,
            provider=provider,
            model=model,
            encrypted_api_key=encrypted_api_key
        )

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        ai_settings = getattr(user, "ai_settings", None)
        return {
            "provider": getattr(ai_settings, "provider", None) if ai_settings else provider,
            "model": getattr(ai_settings, "model", None) if ai_settings else model,
            "has_api_key": bool(getattr(ai_settings, "encrypted_api_key", None)) if ai_settings else bool(encrypted_api_key),
            "updated_at": getattr(ai_settings, "updated_at", None) if ai_settings else datetime.utcnow()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save AI credentials: {str(e)}")
