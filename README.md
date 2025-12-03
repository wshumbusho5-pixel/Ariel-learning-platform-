# Ariel 🌊

**Revolutionary Revision Platform - Learning Forward, Always Positive**

Ariel transforms how students revise by showing **only correct answers** - no distractors, no confusion, just pure learning. Based on cognitive science principles that show the brain encodes what it sees, Ariel eliminates interference from wrong answers during the learning phase.

## 🎯 Core Philosophy

Traditional multiple-choice learning pollutes your memory with wrong answers. Ariel fixes this:

1. **Active Recall** - Attempt questions before seeing answers
2. **Pure Learning** - Only see correct answers, no distractors
3. **Immediate Feedback** - Get the right answer instantly
4. **Cognitive Clarity** - Your brain encodes exactly what's right

## ✨ Unique Features

### 🔗 URL Scraping (Core Differentiator!)
- Paste a link to any past paper or question bank
- AI extracts all questions automatically
- Instant answer generation
- **This feature doesn't exist in other platforms!**

### 📥 Multiple Input Methods
- **URL Scraping** - Paste links to online resources
- **PDF Upload** - Upload past paper PDFs
- **Image OCR** - Take photos of paper questions
- **Bulk Text** - Copy-paste multiple questions at once

### 🧠 Smart Learning Flow
- One question at a time (no overwhelm)
- Reveal answer when ready
- Optional explanations (brief or detailed)
- Progress tracking through sessions

### 🤖 Multi-AI Support
- OpenAI GPT-4
- Anthropic Claude
- Open source models (Ollama)
- Flexible provider selection

## 🏗️ Project Structure

```
ariel/
├── ariel-backend/      # Python FastAPI backend
│   ├── app/
│   │   ├── api/        # API endpoints
│   │   ├── core/       # Config & settings
│   │   ├── models/     # Data models
│   │   ├── services/   # Business logic (AI, scraping)
│   │   └── main.py     # FastAPI app
│   └── requirements.txt
│
├── ariel-web/          # Next.js web app
│   ├── app/            # Next.js app router
│   ├── components/     # React components
│   │   ├── QuestionCard.tsx
│   │   └── InputMethods.tsx
│   └── package.json
│
├── ariel-mobile/       # React Native (coming soon)
└── ariel-shared/       # Shared types/utilities
```

## 🚀 Quick Start

### Backend Setup

1. Navigate to backend:
```bash
cd ariel-backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment:
```bash
cp .env.example .env
# Edit .env and add your API keys:
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY
```

5. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

Backend will be running at `http://localhost:8000`

### Web App Setup

1. Navigate to web app:
```bash
cd ariel-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment:
```bash
cp .env.local.example .env.local
```

4. Run development server:
```bash
npm run dev
```

Web app will be running at `http://localhost:3000`

## 📱 Usage

1. **Choose Input Method**:
   - Paste URL to past papers
   - Upload PDF
   - Take photo of questions
   - Type/paste bulk questions

2. **AI Processing**:
   - Questions extracted automatically
   - Answers generated instantly
   - Ready for learning!

3. **Learn**:
   - Read question
   - Attempt answer mentally
   - Click "Show Answer"
   - See only correct answer
   - Move to next question

4. **Complete Session**:
   - Review all questions
   - Pure learning, no confusion
   - Start new session anytime

## 🎨 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **OpenAI / Anthropic** - AI answer generation
- **BeautifulSoup4** - Web scraping
- **PyTesseract** - OCR for images
- **PyPDF2** - PDF parsing
- **Motor** - Async MongoDB (for future features)

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - API requests
- **Zustand** - State management (for future features)

### Mobile (Planned)
- **React Native** - Cross-platform mobile
- **Expo** - Development tooling

## 🔮 Roadmap

### Phase 1 (MVP) ✅
- [x] Backend API with multiple AI providers
- [x] URL scraping feature
- [x] PDF/Image/Bulk input methods
- [x] Web app with question flow
- [x] Clean, positive UI

### Phase 2 (Coming Soon)
- [ ] User authentication
- [ ] Spaced repetition algorithm
- [ ] Progress tracking & analytics
- [ ] Gamification (streaks, points)
- [ ] Mobile app (React Native)

### Phase 3 (Future)
- [ ] Social features (study groups)
- [ ] AI-generated practice questions
- [ ] Performance insights & recommendations
- [ ] Offline mode
- [ ] Browser extension

## 🧪 API Endpoints

### Scraper
- `POST /api/scraper/scrape-url` - Extract from URL
- `POST /api/scraper/upload-pdf` - Extract from PDF
- `POST /api/scraper/upload-image` - Extract from image
- `POST /api/scraper/bulk-questions` - Process bulk text

### Questions
- `POST /api/questions/answer` - Get answer for single question

### AI
- `GET /api/ai/providers` - List available providers

## 🤝 Contributing

This is a personal project, but ideas and feedback are welcome!

## 📄 License

MIT License - feel free to learn from this code!

## 🙏 Acknowledgments

Built with cognitive science principles in mind:
- **Testing Effect** - Active retrieval strengthens memory
- **No Interference** - Only correct answers, no distractors
- **Immediate Feedback** - Learn right away
- **Positive Reinforcement** - Focus on what's right

---

**Ariel - Learning forward, always positive 🌊**
