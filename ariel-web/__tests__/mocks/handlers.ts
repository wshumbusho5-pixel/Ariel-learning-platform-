import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Mock data
const mockUser = {
  id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  role: 'user',
  total_points: 100,
  level: 2,
  current_streak: 5,
};

const mockToken = 'mock-jwt-token-12345';

const mockCards = [
  {
    id: '1',
    question: 'What is the capital of France?',
    answer: 'Paris',
    subject: 'Geography',
    topic: 'European Capitals',
    difficulty: 'easy',
    tags: ['europe', 'capitals'],
    visibility: 'public',
    created_by: mockUser.id,
  },
  {
    id: '2',
    question: 'What is 2+2?',
    answer: '4',
    subject: 'Mathematics',
    topic: 'Arithmetic',
    difficulty: 'easy',
    tags: ['math', 'basic'],
    visibility: 'public',
    created_by: mockUser.id,
  },
];

export const handlers = [
  // ===== AUTH ENDPOINTS =====

  // Register
  http.post(`${API_BASE_URL}/api/auth/register`, async ({ request }) => {
    const body = await request.json() as any;

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { detail: 'User with this email already exists' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      access_token: mockToken,
      user: {
        ...mockUser,
        email: body.email,
        username: body.username || 'newuser',
      },
    });
  }),

  // Login
  http.post(`${API_BASE_URL}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as any;

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        access_token: mockToken,
        user: mockUser,
      });
    }

    return HttpResponse.json(
      { detail: 'Incorrect email or password' },
      { status: 401 }
    );
  }),

  // OAuth Login
  http.post(`${API_BASE_URL}/api/auth/oauth/login`, async ({ request }) => {
    const body = await request.json() as any;

    if (body.provider === 'google' || body.provider === 'github') {
      return HttpResponse.json({
        access_token: mockToken,
        user: mockUser,
      });
    }

    return HttpResponse.json(
      { detail: 'Invalid provider' },
      { status: 400 }
    );
  }),

  // Get Current User
  http.get(`${API_BASE_URL}/api/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 403 }
      );
    }

    return HttpResponse.json(mockUser);
  }),

  // Update Profile
  http.put(`${API_BASE_URL}/api/auth/profile`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 403 }
      );
    }

    const body = await request.json() as any;
    return HttpResponse.json({
      ...mockUser,
      ...body,
    });
  }),

  // ===== CARDS ENDPOINTS =====

  // Get My Deck
  http.get(`${API_BASE_URL}/api/cards/my-deck`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 403 }
      );
    }

    return HttpResponse.json(mockCards);
  }),

  // Get Public Cards
  http.get(`${API_BASE_URL}/api/cards/public`, () => {
    return HttpResponse.json(mockCards);
  }),

  // Create Card
  http.post(`${API_BASE_URL}/api/cards/`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 403 }
      );
    }

    const body = await request.json() as any;
    const newCard = {
      id: '3',
      ...body,
      created_by: mockUser.id,
      created_at: new Date().toISOString(),
    };

    return HttpResponse.json(newCard, { status: 201 });
  }),

  // Get Card by ID
  http.get(`${API_BASE_URL}/api/cards/:id`, ({ params }) => {
    const card = mockCards.find(c => c.id === params.id);

    if (!card) {
      return HttpResponse.json(
        { detail: 'Card not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(card);
  }),

  // Update Card
  http.put(`${API_BASE_URL}/api/cards/:id`, async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 403 }
      );
    }

    const card = mockCards.find(c => c.id === params.id);

    if (!card) {
      return HttpResponse.json(
        { detail: 'Card not found' },
        { status: 404 }
      );
    }

    const body = await request.json() as any;
    const updatedCard = { ...card, ...body };

    return HttpResponse.json(updatedCard);
  }),

  // Delete Card
  http.delete(`${API_BASE_URL}/api/cards/:id`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 403 }
      );
    }

    const card = mockCards.find(c => c.id === params.id);

    if (!card) {
      return HttpResponse.json(
        { detail: 'Card not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ message: 'Card deleted' });
  }),

  // ===== AI ENDPOINTS =====

  // AI Chat
  http.post(`${API_BASE_URL}/api/ai/chat`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 403 }
      );
    }

    const body = await request.json() as any;

    return HttpResponse.json({
      response: `This is a mock AI response to: ${body.message}`,
      conversation_id: 'mock-conv-123',
    });
  }),

  // Generate Card
  http.post(`${API_BASE_URL}/api/ai/generate-card`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 403 }
      );
    }

    const body = await request.json() as any;

    return HttpResponse.json({
      question: 'Generated question from AI',
      answer: 'Generated answer from AI',
      explanation: 'Generated explanation',
      subject: body.subject || 'General',
    });
  }),

  // Get AI Providers
  http.get(`${API_BASE_URL}/api/ai/providers`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 403 }
      );
    }

    return HttpResponse.json({
      providers: [
        { name: 'openai', models: ['gpt-4', 'gpt-3.5-turbo'] },
        { name: 'anthropic', models: ['claude-3-opus', 'claude-3-sonnet'] },
        { name: 'ollama', models: ['llama3', 'mistral'] },
      ],
    });
  }),

  // ===== SCRAPER ENDPOINTS =====

  // Scrape URL
  http.post(`${API_BASE_URL}/api/scraper/scrape`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 403 }
      );
    }

    return HttpResponse.json({
      questions: [
        'What is React?',
        'What is Next.js?',
        'What is TypeScript?',
      ],
      success: true,
    });
  }),
];
