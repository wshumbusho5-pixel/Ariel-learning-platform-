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
            if hasattr(self.ai_service, '_openai_generate'):
                response = await self.ai_service._openai_generate(prompt)
                ai_questions = response.get("questions", [])
                if len(ai_questions) > 0:
                    return ai_questions
        except Exception as e:
            print(f"AI extraction failed: {str(e)}")
            pass

        # If everything fails, return empty list with helpful message
        if len(pattern_questions) == 0:
            raise Exception("No questions found on this page. The page might not contain educational questions, or they may be in an unrecognized format. Try the 'Bulk Questions' tab to paste questions directly.")

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
