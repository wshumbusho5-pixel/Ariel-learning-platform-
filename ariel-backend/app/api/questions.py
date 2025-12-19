from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import AIService
from app.api.auth import get_optional_user_dependency
from app.utils.ai_credentials import resolve_ai_credentials

router = APIRouter()

class SingleQuestionRequest(BaseModel):
    question: str
    context: Optional[str] = None
    detailed: bool = False

class AnswerResponse(BaseModel):
    question: str
    answer: str
    explanation: Optional[str] = None
    detailed_explanation: Optional[str] = None

@router.post("/answer", response_model=AnswerResponse)
async def get_answer(
    request: SingleQuestionRequest,
    raw_request: Request,
    current_user=Depends(get_optional_user_dependency)
):
    """
    Get answer for a single question
    """
    try:
        creds = resolve_ai_credentials(raw_request, current_user)
        ai_service = AIService(provider=creds.provider, api_key=creds.api_key, model=creds.model)
        result = await ai_service.generate_answer(
            question=request.question,
            context=request.context,
            include_explanation=True,
            detailed=request.detailed
        )

        return {
            "question": request.question,
            "answer": result["answer"],
            "explanation": result.get("explanation"),
            "detailed_explanation": result.get("detailed_explanation")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
