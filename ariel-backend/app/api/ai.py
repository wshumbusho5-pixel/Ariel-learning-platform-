from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.ai_service import AIService
from app.core.config import settings

router = APIRouter()

class AIProvider(BaseModel):
    name: str
    available: bool
    description: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    provider: Optional[str] = None

class ChatCard(BaseModel):
    question: str
    answer: str
    explanation: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    cards: Optional[List[ChatCard]] = None

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

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Lightweight chat endpoint for Ariel Assistant.
    Uses configured AI provider (defaults to settings.DEFAULT_AI_PROVIDER).
    """
    try:
        ai = AIService(provider=request.provider or settings.DEFAULT_AI_PROVIDER)
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
