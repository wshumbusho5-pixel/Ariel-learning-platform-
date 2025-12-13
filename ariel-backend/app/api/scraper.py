from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, HttpUrl
from typing import List
from app.services.scraper_service import ScraperService
from app.services.ai_service import AIService

router = APIRouter()
scraper_service = ScraperService()
ai_service = AIService()

MAX_FILE_BYTES = 8 * 1024 * 1024  # 8 MB limit for uploads
MAX_BULK_QUESTIONS = 50

class URLScrapeRequest(BaseModel):
    url: HttpUrl

class BulkQuestionsRequest(BaseModel):
    questions: List[str]

@router.post("/scrape-url")
async def scrape_url(request: URLScrapeRequest):
    """
    Scrape questions from a URL - CORE DIFFERENTIATOR FEATURE

    Student pastes a link to past paper/questions → AI extracts all questions
    """
    try:
        print(f"Scraping URL: {request.url}")
        result = await scraper_service.scrape_url(str(request.url))
        print(f"Found {len(result['questions'])} questions")

        # Now get answers for all questions
        questions = result["questions"]
        answers = await ai_service.generate_answers_batch(questions)

        return {
            "success": True,
            "source": {
                "url": result["url"],
                "title": result["title"],
                "question_count": result["question_count"]
            },
            "question_set": [
                {
                    "question": q,
                    "answer": answers[i]["answer"],
                    "explanation": answers[i].get("explanation", "")
                }
                for i, q in enumerate(questions)
            ]
        }
    except Exception as e:
        print(f"Scraper error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload PDF and extract questions
    """
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        content = await file.read()
        if len(content) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="PDF too large. Max 8MB.")
        questions = await scraper_service.extract_from_pdf(content)

        # Get answers
        answers = await ai_service.generate_answers_batch(questions)

        return {
            "success": True,
            "source": {"filename": file.filename, "question_count": len(questions)},
            "question_set": [
                {
                    "question": q,
                    "answer": answers[i]["answer"],
                    "explanation": answers[i].get("explanation", "")
                }
                for i, q in enumerate(questions)
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload image and extract questions using OCR
    """
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        content = await file.read()
        if len(content) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="Image too large. Max 8MB.")
        questions = await scraper_service.extract_from_image(content)

        # Get answers
        answers = await ai_service.generate_answers_batch(questions)

        return {
            "success": True,
            "source": {"filename": file.filename, "question_count": len(questions)},
            "question_set": [
                {
                    "question": q,
                    "answer": answers[i]["answer"],
                    "explanation": answers[i].get("explanation", "")
                }
                for i, q in enumerate(questions)
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/bulk-questions")
async def process_bulk_questions(request: BulkQuestionsRequest):
    """
    Process multiple questions submitted as text
    """
    try:
        if len(request.questions) == 0:
            raise HTTPException(status_code=400, detail="No questions provided")
        if len(request.questions) > MAX_BULK_QUESTIONS:
            raise HTTPException(status_code=400, detail=f"Too many questions. Limit {MAX_BULK_QUESTIONS} at a time.")
        trimmed = [q.strip() for q in request.questions if q.strip()]
        if not trimmed:
            raise HTTPException(status_code=400, detail="No valid questions found")

        answers = await ai_service.generate_answers_batch(request.questions)

        return {
            "success": True,
            "question_count": len(request.questions),
            "question_set": [
                {
                    "question": q,
                    "answer": answers[i]["answer"],
                    "explanation": answers[i].get("explanation", "")
                }
                for i, q in enumerate(request.questions)
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
