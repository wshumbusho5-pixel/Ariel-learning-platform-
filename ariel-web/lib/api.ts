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

export default api;
