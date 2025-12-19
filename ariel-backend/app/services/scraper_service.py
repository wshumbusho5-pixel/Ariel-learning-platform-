import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import re
from app.services.ai_service import AIService
from app.core.config import settings

class ScraperService:
    def __init__(self):
        self.ai_service = AIService()

    async def scrape_url(self, url: str, ai_service: Optional[AIService] = None) -> Dict:
        """
        Scrape questions from a URL.
        Returns extracted questions and metadata.
        """
        ai_client = ai_service or self.ai_service
        try:
            # Fetch the page
            async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                response = await client.get(url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })
                response.raise_for_status()

            content_type = response.headers.get("content-type", "").lower()

            # If the URL is a PDF, process as PDF
            if "application/pdf" in content_type or url.lower().endswith(".pdf"):
                questions = await self.extract_from_pdf(response.content)
                return {
                    "url": url,
                    "title": url.split("/")[-1],
                    "questions": questions,
                    "question_count": len(questions)
                }

            # If it's an image, process as image
            if any(img_type in content_type for img_type in ["image/", "image/png", "image/jpeg", "image/jpg", "image/webp"]):
                questions = await self.extract_from_image(response.content)
                return {
                    "url": url,
                    "title": url.split("/")[-1],
                    "questions": questions,
                    "question_count": len(questions)
                }

            # Parse HTML
            soup = BeautifulSoup(response.text, 'lxml')

            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()

            # Get text content
            text_content = soup.get_text(separator='\n', strip=True)

            # Extract questions using AI
            questions = await self._extract_questions_with_ai(text_content, url, ai_client)

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

    async def _extract_questions_with_ai(self, content: str, source_url: str, ai_client: AIService) -> List[str]:
        """
        Use AI to intelligently extract questions from scraped content.
        This is smarter than regex - it understands context.
        """
        # First try pattern matching (faster and doesn't need API key)
        pattern_questions = self._extract_questions_pattern(content)

        if len(pattern_questions) > 0:
            return pattern_questions

        # If pattern matching found nothing, try AI (if API key is available)
        prompt = f"""Analyze this content from a webpage and extract ALL questions.

Content:
{content[:8000]}

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
            ai_questions = await self._extract_questions_with_provider(prompt, ai_client)
            if ai_questions:
                return ai_questions
        except Exception as e:
            print(f"AI extraction failed: {str(e)}")
            pass

        # If everything fails, return empty list with helpful message
        if len(pattern_questions) == 0:
            raise Exception("No questions found on this page. The page might not contain educational questions, or they may be in an unrecognized format. Try the 'Bulk Questions' tab to paste questions directly.")

    async def _extract_questions_with_provider(self, prompt: str, ai_client: AIService) -> Optional[List[str]]:
        """
        Call AI extraction using the configured provider first, then fallbacks.
        Honors DEFAULT_AI_PROVIDER so Ollama works when chosen.
        """
        preferred = self._get_provider_priority(ai_client)

        for provider in preferred:
            try:
                if provider == "ollama":
                    response = await ai_client._ollama_generate(prompt)
                elif provider == "anthropic" and hasattr(ai_client, "anthropic_client"):
                    response = await ai_client._anthropic_generate(prompt)
                elif provider == "openai" and ai_client.api_key:
                    response = await ai_client._openai_generate(prompt)
                else:
                    continue

                questions = self._extract_questions_from_response(response)
                if questions:
                    return questions
            except Exception as e:
                print(f"AI extraction failed with {provider}: {e}")
                continue

        return None

    def _get_provider_priority(self, ai_client: AIService) -> List[str]:
        """Order providers so we try the configured default first, with sensible fallbacks."""
        base_order = ["ollama", "anthropic", "openai"]
        if ai_client.provider in base_order:
            first = ai_client.provider
            return [first] + [p for p in base_order if p != first]
        return base_order

    def _extract_questions_from_response(self, response: any) -> List[str]:
        """
        Normalize AI responses into a list of questions.
        Handles JSON dict, list, or plain text fallbacks.
        """
        questions: List[str] = []

        # Dict with "questions"
        if isinstance(response, dict):
            if "questions" in response and isinstance(response["questions"], list):
                questions = [q for q in response["questions"] if isinstance(q, str) and q.strip()]
            elif "answer" in response and isinstance(response["answer"], list):
                questions = [q for q in response["answer"] if isinstance(q, str) and q.strip()]
        # Plain list
        elif isinstance(response, list):
            questions = [q for q in response if isinstance(q, str) and q.strip()]
        # JSON string or plain text
        elif isinstance(response, str):
            try:
                import json
                data = json.loads(response)
                return self._extract_questions_from_response(data)
            except Exception:
                # Fallback: split lines that look like questions
                lines = [l.strip() for l in response.splitlines() if l.strip()]
                for line in lines:
                    if line.endswith("?") or line.lower().startswith(("what", "why", "how", "when", "where", "who", "which")):
                        questions.append(line)

        # Deduplicate and limit
        questions = list(dict.fromkeys(questions))
        return questions[:50]

    def _extract_questions_pattern(self, content: str) -> List[str]:
        """
        Fallback: Extract questions using pattern matching.
        Looks for common question patterns.
        """
        questions = []

        # Split into lines for easier processing
        lines = content.split('\n')

        for i, line in enumerate(lines):
            line = line.strip()

            # Skip empty lines or very short lines
            if len(line) < 10:
                continue

            # Pattern 1: Numbered questions (1. Question or 1) Question or Q1. Question)
            if re.match(r'^\s*(?:\d+[.)]|Q\d+[.:])\s+', line):
                # Get the full question (might span multiple lines)
                question = line
                # Check next few lines for continuation
                j = i + 1
                while j < len(lines) and j < i + 5:
                    next_line = lines[j].strip()
                    if next_line and not re.match(r'^\s*(?:\d+[.)]|Q\d+[.:])\s+', next_line):
                        question += " " + next_line
                        j += 1
                    else:
                        break
                questions.append(question)

            # Pattern 2: Lines ending with question mark
            elif line.endswith('?'):
                questions.append(line)

            # Pattern 3: Lines starting with question words
            elif re.match(r'^(What|When|Where|Who|Why|How|Which|Can|Does|Is|Are|Do|Will|Would|Should|Could)\s+', line, re.IGNORECASE):
                # Likely a question even without ?
                question = line
                # Check if next line continues it
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if next_line and not re.match(r'^\s*(?:\d+[.)]|Q\d+[.:])', next_line):
                        question += " " + next_line
                questions.append(question)

        # Clean up and deduplicate
        questions = [q.strip() for q in questions if len(q.strip()) > 15]
        questions = list(dict.fromkeys(questions))  # Remove duplicates while preserving order

        # Filter out non-questions (like headers, navigation)
        filtered_questions = []
        for q in questions:
            # Skip if too short or looks like navigation/header
            if len(q) > 200 or len(q) < 10:
                continue
            if any(word in q.lower() for word in ['login', 'signup', 'copyright', 'privacy', 'cookie', 'menu', 'navigation']):
                continue
            filtered_questions.append(q)

        return filtered_questions[:50]  # Limit to 50 questions max

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
