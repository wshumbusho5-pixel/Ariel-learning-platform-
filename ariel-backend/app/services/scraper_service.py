import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import re
from app.services.ai_service import AIService

class ScraperService:
    def __init__(self):
        self.ai_service = AIService()

    async def scrape_url(self, url: str) -> Dict:
        """
        Scrape questions from a URL.
        Returns extracted questions and metadata.
        """
        try:
            # Fetch the page
            async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                response = await client.get(url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })
                response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.text, 'lxml')

            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()

            # Get text content
            text_content = soup.get_text(separator='\n', strip=True)

            # Extract questions using AI
            questions = await self._extract_questions_with_ai(text_content, url)

            return {
                "url": url,
                "title": soup.title.string if soup.title else "Untitled",
                "questions": questions,
                "question_count": len(questions)
            }

        except httpx.HTTPError as e:
            raise Exception(f"Failed to fetch URL: {str(e)}")
        except Exception as e:
            raise Exception(f"Scraping error: {str(e)}")

    async def _extract_questions_with_ai(self, content: str, source_url: str) -> List[str]:
        """
        Use AI to intelligently extract questions from scraped content.
        This is smarter than regex - it understands context.
        """
        prompt = f"""Analyze this content from a webpage and extract ALL questions.

Content:
{content[:8000]}  # Limit to avoid token limits

Instructions:
1. Identify all questions (numbered, bulleted, or in paragraphs)
2. Extract each question verbatim
3. Ignore headers, navigation, ads, or irrelevant content
4. Return ONLY the questions in this JSON format:

{{
  "questions": [
    "Question 1 text here",
    "Question 2 text here",
    ...
  ]
}}

If no questions are found, return {{"questions": []}}
"""

        try:
            response = await self.ai_service._openai_generate(prompt) if hasattr(self.ai_service, '_openai_generate') else {}
            return response.get("questions", [])
        except:
            # Fallback to simple pattern matching if AI fails
            return self._extract_questions_pattern(content)

    def _extract_questions_pattern(self, content: str) -> List[str]:
        """
        Fallback: Extract questions using pattern matching.
        Looks for common question patterns.
        """
        questions = []

        # Pattern 1: Numbered questions (1. Question? or 1) Question?)
        numbered_pattern = r'(?:^|\n)\s*(\d+[.)]\s+.+?\?)'
        numbered_matches = re.findall(numbered_pattern, content, re.MULTILINE)
        questions.extend(numbered_matches)

        # Pattern 2: Questions ending with ?
        question_mark_pattern = r'(?:^|\n)([A-Z][^.!?]*\?)'
        question_matches = re.findall(question_mark_pattern, content, re.MULTILINE)
        questions.extend(question_matches)

        # Clean up and deduplicate
        questions = [q.strip() for q in questions if len(q.strip()) > 10]
        questions = list(dict.fromkeys(questions))  # Remove duplicates while preserving order

        return questions[:50]  # Limit to 50 questions max

    async def extract_from_pdf(self, pdf_content: bytes) -> List[str]:
        """Extract questions from PDF content"""
        from PyPDF2 import PdfReader
        import io

        try:
            pdf_file = io.BytesIO(pdf_content)
            reader = PdfReader(pdf_file)

            # Extract text from all pages
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"

            # Use AI to extract questions
            questions = await self._extract_questions_with_ai(text, "pdf")

            return questions

        except Exception as e:
            raise Exception(f"PDF extraction error: {str(e)}")

    async def extract_from_image(self, image_content: bytes) -> List[str]:
        """Extract questions from image using OCR"""
        import pytesseract
        from PIL import Image
        import io

        try:
            # Open image
            image = Image.open(io.BytesIO(image_content))

            # Perform OCR
            text = pytesseract.image_to_string(image)

            # Extract questions
            questions = await self._extract_questions_with_ai(text, "image")

            return questions

        except Exception as e:
            raise Exception(f"OCR error: {str(e)}")
