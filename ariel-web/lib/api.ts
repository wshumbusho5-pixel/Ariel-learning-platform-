import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (email: string, password: string, username?: string, fullName?: string) => {
    const response = await api.post('/api/auth/register', {
      email,
      password,
      username,
      full_name: fullName,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  oauthLogin: async (provider: 'google' | 'github', accessToken: string) => {
    const response = await api.post('/api/auth/oauth/login', {
      provider,
      access_token: accessToken,
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Progress API
export const progressAPI = {
  createCard: async (questionId: string, questionText: string, correctAnswer: string) => {
    const response = await api.post('/api/progress/cards', {
      question_id: questionId,
      question_text: questionText,
      correct_answer: correctAnswer,
    });
    return response.data;
  },

  getDueCards: async (limit: number = 20) => {
    const response = await api.get(`/api/progress/cards/due?limit=${limit}`);
    return response.data;
  },

  submitReview: async (cardId: string, quality: number, timeSpent?: number) => {
    const response = await api.post('/api/progress/reviews', {
      card_id: cardId,
      quality,
      time_spent_seconds: timeSpent,
    });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/progress/stats');
    return response.data;
  },
};

// Gamification API
export const gamificationAPI = {
  getLevel: async () => {
    const response = await api.get('/api/gamification/level');
    return response.data;
  },

  getAchievements: async () => {
    const response = await api.get('/api/gamification/achievements');
    return response.data;
  },

  getDailyGoal: async () => {
    const response = await api.get('/api/gamification/daily-goal');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/gamification/stats');
    return response.data;
  },
};

// Scraper API
export const scraperAPI = {
  scrapeUrl: async (url: string) => {
    const response = await api.post('/api/scraper/scrape-url', { url });
    return response.data;
  },

  uploadPdf: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/scraper/upload-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/scraper/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  bulkQuestions: async (questions: string[]) => {
    const response = await api.post('/api/scraper/bulk-questions', { questions });
    return response.data;
  },
};

// Cards API (Flashcards with social features)
export const cardsAPI = {
  // Create cards
  createCard: async (cardData: any) => {
    const response = await api.post('/api/cards/', cardData);
    return response.data;
  },

  createCardsBulk: async (cards: any[], subject?: string, topic?: string, tags?: string[]) => {
    const response = await api.post('/api/cards/bulk', {
      cards,
      subject,
      topic,
      tags,
    });
    return response.data;
  },

  // Get cards
  getMyDeck: async (filters?: { subject?: string; topic?: string; tags?: string[]; limit?: number; skip?: number }) => {
    const params = new URLSearchParams();
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.topic) params.append('topic', filters.topic);
    if (filters?.tags) filters.tags.forEach(tag => params.append('tags', tag));
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.skip) params.append('skip', filters.skip.toString());

    const response = await api.get(`/api/cards/my-deck?${params}`);
    return response.data;
  },

  getDueCards: async (limit: number = 20) => {
    const response = await api.get(`/api/cards/due?limit=${limit}`);
    return response.data;
  },

  getTrendingCards: async (limit: number = 50) => {
    const response = await api.get(`/api/cards/trending?limit=${limit}`);
    return response.data;
  },

  getCard: async (cardId: string) => {
    const response = await api.get(`/api/cards/${cardId}`);
    return response.data;
  },

  getDeckStats: async () => {
    const response = await api.get('/api/cards/stats');
    return response.data;
  },

  // Update/Delete cards
  updateCard: async (cardId: string, updateData: any) => {
    const response = await api.put(`/api/cards/${cardId}`, updateData);
    return response.data;
  },

  deleteCard: async (cardId: string) => {
    const response = await api.delete(`/api/cards/${cardId}`);
    return response.data;
  },

  // Review cards
  reviewCard: async (cardId: string, quality: number) => {
    const response = await api.post(`/api/cards/${cardId}/review?quality=${quality}`);
    return response.data;
  },

  // Social features
  likeCard: async (cardId: string) => {
    const response = await api.post(`/api/cards/${cardId}/like`);
    return response.data;
  },

  saveCardToDeck: async (cardId: string) => {
    const response = await api.post(`/api/cards/${cardId}/save`);
    return response.data;
  },
};

export default api;
