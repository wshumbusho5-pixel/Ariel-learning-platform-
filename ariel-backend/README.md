# Ariel Backend API

Revolutionary revision platform - AI-powered learning without distractors.

## Features

- **URL Scraping** - Paste link to past papers, AI extracts questions
- **Multiple Input Methods** - URL, PDF, Image OCR, Bulk text
- **Multi-AI Provider** - OpenAI, Anthropic Claude, or open source
- **Pure Answers** - Only correct answers, no distractors
- **Adaptive Explanations** - Brief or detailed, student's choice

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your API keys
```

4. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Scraper Endpoints
- `POST /api/scraper/scrape-url` - Extract questions from URL
- `POST /api/scraper/upload-pdf` - Extract from PDF
- `POST /api/scraper/upload-image` - Extract from image (OCR)
- `POST /api/scraper/bulk-questions` - Process bulk text questions

### Question Endpoints
- `POST /api/questions/answer` - Get answer for single question

### AI Endpoints
- `GET /api/ai/providers` - List available AI providers

## Example Usage

### Scrape URL
```bash
curl -X POST http://localhost:8000/api/scraper/scrape-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/past-papers"}'
```

### Single Question
```bash
curl -X POST http://localhost:8000/api/questions/answer \
  -H "Content-Type: application/json" \
  -d '{"question": "What is photosynthesis?", "detailed": true}'
```

## Tech Stack

- FastAPI - Modern Python web framework
- OpenAI/Anthropic - AI providers
- BeautifulSoup4 - Web scraping
- PyTesseract - OCR for images
- PyPDF2 - PDF parsing
- Motor - Async MongoDB driver

## Philosophy

Ariel believes in **positive learning** - showing only correct answers without confusion from wrong options. The brain encodes what it sees, so we show only truth.
