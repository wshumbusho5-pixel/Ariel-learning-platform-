from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

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
async def get_answer(request: SingleQuestionRequest):
    """
    Get answer for a single question
    """
    try:
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
