# Ariel 🌊
**Full-Stack AI-Powered Learning Platform**

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

> A revolutionary study platform that eliminates wrong answers from the learning process. Built with FastAPI, Next.js, and multiple AI providers (OpenAI, Anthropic, Ollama).

[🔗 Live Demo](#) • [📖 Documentation](#project-structure) • [🚀 Quick Start](#-quick-start)

---

## 🎯 What Makes This Special

Traditional multiple-choice learning pollutes memory with wrong answers. Ariel solves this using cognitive science principles:

- ✅ **Active Recall** - Test yourself before seeing answers
- ✅ **Pure Learning** - Only correct answers shown, zero distractors
- ✅ **Immediate Feedback** - Instant reinforcement
- ✅ **Smart Content Extraction** - URL scraping, PDF parsing, OCR

### 🔥 Unique Feature: URL-Based Question Extraction
**This doesn't exist in competing platforms.** Paste any link to past papers or question banks, and Ariel automatically:
1. Scrapes and parses the content
2. Extracts all questions using AI
3. Generates accurate answers
4. Creates a ready-to-study session

---

## 🛠️ Tech Stack

### Backend (Python)
- **FastAPI** - High-performance async API framework
- **OpenAI GPT-4** - Primary AI provider for answer generation
- **Anthropic Claude** - Alternative AI provider
- **Ollama** - Local open-source models support
- **BeautifulSoup4** - Web scraping and HTML parsing
- **PyTesseract** - OCR for image-based question extraction
- **PyPDF2** - PDF text extraction
- **SQLite/PostgreSQL** - User data and progress tracking
- **Pydantic** - Data validation and settings management

### Frontend (TypeScript/React)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Full type safety across the application
- **Tailwind CSS** - Utility-first styling
- **Axios** - API client with error handling
- **React Hooks** - State management and side effects
- **Responsive Design** - Mobile-first approach

### DevOps & Tools
- **Git** - Version control
- **pytest** - Backend testing suite
- **ESLint** - Code quality enforcement
- **Environment Variables** - Secure API key management

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Next.js Web   │  ← React components, Tailwind UI, TypeScript
│   (Port 3000)   │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│  FastAPI Server │  ← Python, async endpoints, Pydantic models
│   (Port 8000)   │
└────────┬────────┘
         │
    ┌────┴─────┬─────────┬─────────┐
    ▼          ▼         ▼         ▼
┌──────┐  ┌────────┐ ┌─────┐  ┌──────┐
│OpenAI│  │Anthropic│ │Ollama│  │SQLite│
└──────┘  └────────┘ └─────┘  └──────┘
```

### Project Structure
```
ariel-learning-platform/
├── ariel-backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai.py           # AI provider management
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── questions.py    # Question/answer logic
│   │   │   └── scraper.py      # Content extraction endpoints
│   │   ├── services/
│   │   │   ├── ai_service.py   # Multi-provider AI integration
│   │   │   ├── scraper_service.py  # Web/PDF/OCR extraction
│   │   │   └── database_service.py # Data persistence
│   │   ├── models/             # Pydantic data models
│   │   └── main.py             # FastAPI application entry
│   ├── tests/                  # pytest test suite
│   └── requirements.txt
│
└── ariel-web/                  # Next.js frontend
    ├── app/                    # Next.js 14 App Router
    │   ├── dashboard/          # Main learning interface
    │   ├── review/             # Spaced repetition
    │   └── create-cards/       # Question input methods
    ├── components/
    │   ├── ArielAssistant.tsx  # AI chat interface
    │   ├── InputMethods.tsx    # Multi-source content input
    │   └── AuthModal.tsx       # User authentication
    ├── lib/
    │   ├── api.ts              # API client with error handling
    │   └── useAuth.ts          # Authentication hook
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- API keys (OpenAI and/or Anthropic)

### Backend Setup

```bash
cd ariel-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add your API keys to .env:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# Run server
uvicorn app.main:app --reload --port 8000
```

Backend available at `http://localhost:8000`
Interactive API docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd ariel-web

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local

# Run development server
npm run dev
```

Web app available at `http://localhost:3000`

---

## ✨ Key Features

### 📥 Multiple Input Methods
| Method | Use Case | Technology |
|--------|----------|------------|
| **URL Scraping** | Paste links to online question banks | BeautifulSoup4 + AI parsing |
| **PDF Upload** | Upload past paper PDFs | PyPDF2 text extraction |
| **Image OCR** | Photo of printed questions | PyTesseract OCR |
| **Bulk Text** | Copy-paste multiple questions | AI-powered question separation |

### 🧠 Smart Learning Flow
1. **Content Extraction** - AI identifies and structures questions
2. **One-at-a-Time Display** - Focus without overwhelm
3. **Active Recall** - Attempt answer mentally
4. **Reveal Answer** - See only correct answer (no distractors)
5. **Optional Explanations** - Request brief or detailed explanations
6. **Progress Tracking** - Session completion and analytics

### 🤖 Multi-AI Provider Support
- **Primary**: OpenAI GPT-4 (high accuracy)
- **Alternative**: Anthropic Claude (fast, cost-effective)
- **Local**: Ollama (privacy, offline capability)
- **Fallback Logic**: Auto-switches if primary fails

### 🔒 Authentication & Security
- JWT-based session management
- Password hashing (bcrypt)
- Rate limiting on expensive AI operations
- Input validation and sanitization
- CORS configuration

---

## 📊 API Endpoints

### Scraping & Extraction
```http
POST /api/scraper/scrape-url
POST /api/scraper/upload-pdf
POST /api/scraper/upload-image
POST /api/scraper/bulk-questions
```

### Question Management
```http
POST /api/questions/answer
GET  /api/questions/decks
POST /api/questions/decks
```

### AI Integration
```http
GET  /api/ai/providers
POST /api/ai/chat
```

### Authentication
```http
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

Full API documentation: `http://localhost:8000/docs` (when backend is running)

---

## 🧪 Testing

```bash
# Backend tests
cd ariel-backend
pytest tests/ -v --cov=app

# Frontend type checking
cd ariel-web
npm run type-check
npm run lint
```

---

## 📈 Roadmap

### ✅ Phase 1 - MVP (Completed)
- [x] Multi-provider AI integration (OpenAI, Anthropic, Ollama)
- [x] URL scraping with automatic question extraction
- [x] PDF/Image/Bulk text input methods
- [x] User authentication and session management
- [x] Responsive web interface
- [x] Spaced repetition algorithm foundation

### 🚧 Phase 2 - Enhancement (In Progress)
- [ ] Advanced analytics dashboard
- [ ] Gamification (streaks, achievements, leaderboards)
- [ ] Social features (study groups, shared decks)
- [ ] Mobile app (React Native/Expo)
- [ ] Browser extension for in-context learning

### 🔮 Phase 3 - Scale
- [ ] AI-generated practice questions
- [ ] Performance insights and recommendations
- [ ] Offline mode with sync
- [ ] Multi-language support
- [ ] Integration with popular learning platforms

---

## 💡 Technical Highlights

### What I Learned Building This:
1. **Async Python** - FastAPI's async/await patterns for concurrent AI requests
2. **Multi-Provider Abstraction** - Unified interface for different AI APIs
3. **Web Scraping Challenges** - Handling diverse HTML structures and rate limits
4. **OCR Limitations** - Preprocessing images for better text extraction
5. **State Management** - Balancing server-side and client-side state in Next.js
6. **Error Handling** - Graceful degradation when AI providers fail
7. **API Design** - RESTful principles and OpenAPI documentation
8. **Type Safety** - Pydantic (Python) + TypeScript for end-to-end validation

### Challenges Solved:
- **AI Consistency**: Different providers return varied formats → Normalized with Pydantic schemas
- **Rate Limiting**: Expensive AI calls → Implemented caching and user quotas
- **Content Extraction**: Messy PDFs/images → Multi-stage parsing with fallbacks
- **Authentication**: Secure token management → JWT with httpOnly cookies

---

## 🤝 Contributing

This is a personal project demonstrating full-stack development skills, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

## 🙏 Built On

**Cognitive Science Principles:**
- **Testing Effect** - Retrieval practice strengthens memory more than re-reading
- **No Interference** - Wrong answers during learning create false memories
- **Immediate Feedback** - Timely correction prevents misinformation encoding
- **Positive Reinforcement** - Focus on correct answers builds confidence

**Inspired By:**
- Spaced repetition research (Piotr Woźniak)
- Anki's flashcard system
- Modern EdTech gaps in question extraction

---

**Built by [Willy Shumbusho](https://github.com/wshumbusho5-pixel)** | [LinkedIn](#) | [Portfolio](#)

*Ariel - Learning forward, always positive* 🌊
