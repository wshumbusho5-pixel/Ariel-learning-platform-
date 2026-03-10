import axios from 'axios';
import { loadLocalAICredentials } from './aiCredentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // avoid hanging forever when API is down
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach BYO AI provider headers when available locally
  const aiPrefs = loadLocalAICredentials();
  if (aiPrefs?.apiKey) {
    config.headers['X-AI-Provider'] = aiPrefs.provider;
    config.headers['X-AI-Key'] = aiPrefs.apiKey;
    if (aiPrefs.model) config.headers['X-AI-Model'] = aiPrefs.model;
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

  updateProfile: async (profileData: {
    full_name?: string;
    username?: string;
    bio?: string;
    education_level?: string;
    year_level?: string;
    subjects?: string[];
    learning_goals?: string[];
    study_preferences?: string[];
    onboarding_completed?: boolean;
  }) => {
    const response = await api.put('/api/auth/profile', profileData);
    return response.data;
  },

  uploadProfilePicture: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/auth/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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

  createCardsBulk: async (cards: any[], subject?: string, topic?: string, tags?: string[], visibility: 'public' | 'private' = 'private') => {
    const response = await api.post('/api/cards/bulk', {
      cards,
      subject,
      topic,
      tags,
      visibility,
    });
    return response.data;
  },

  search: async (q: string, limit = 30) => {
    const response = await api.get(`/api/cards/search?q=${encodeURIComponent(q)}&limit=${limit}`);
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

  getPersonalizedFeed: async (limit: number = 50, offset: number = 0) => {
    const response = await api.get(`/api/cards/personalized-feed?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  getFeedInsights: async () => {
    const response = await api.get('/api/cards/feed-insights');
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

// AI Card Generator API
export const aiGeneratorAPI = {
  generateForSubject: async (subject: string, numCards: number = 10, topic?: string) => {
    const response = await api.post('/api/ai/generate/subject', {
      subject,
      num_cards: numCards,
      topic,
    });
    return response.data;
  },

  generateDailyCards: async (cardsPerSubject: number = 5) => {
    const response = await api.post('/api/ai/generate/daily', {
      cards_per_subject: cardsPerSubject,
    });
    return response.data;
  },

  generateExamPrep: async (subject: string, examDate?: Date, numCards: number = 20) => {
    const response = await api.post('/api/ai/generate/exam-prep', {
      subject,
      exam_date: examDate?.toISOString(),
      num_cards: numCards,
    });
    return response.data;
  },

  getAvailableSubjects: async () => {
    const response = await api.get('/api/ai/subjects');
    return response.data;
  },
};

// General AI chat
export const aiChatAPI = {
  sendMessage: async (message: string, context?: string) => {
    const response = await api.post('/api/ai/chat', { message, context });
    return response.data as { reply: string; cards?: { question: string; answer: string; explanation?: string }[] };
  },
  complete: async (prompt: string) => {
    const response = await api.post('/api/ai/complete', { prompt });
    return response.data as { reply: string };
  },
};

// AI Credentials (BYO keys)
export const aiCredentialsAPI = {
  get: async () => {
    const response = await api.get('/api/ai/credentials');
    return response.data as { provider?: string; model?: string; has_api_key: boolean; updated_at?: string };
  },
  save: async (payload: { provider?: string; api_key?: string; model?: string; remove_key?: boolean }) => {
    const response = await api.put('/api/ai/credentials', payload);
    return response.data as { provider?: string; model?: string; has_api_key: boolean; updated_at?: string };
  },
};

// Social API - Follow/Unfollow, Profiles, Feed
export const socialAPI = {
  // Follow/Unfollow
  followUser: async (userId: string) => {
    const response = await api.post(`/api/social/users/${userId}/follow`);
    return response.data;
  },

  unfollowUser: async (userId: string) => {
    const response = await api.post(`/api/social/users/${userId}/follow`);
    return response.data;
  },

  // User Profiles
  getUserProfile: async (userId: string) => {
    const response = await api.get(`/api/social/profile/${userId}`);
    return response.data;
  },

  getFollowers: async (userId: string) => {
    const response = await api.get(`/api/social/followers/${userId}`);
    return response.data;
  },

  getFollowing: async (userId: string) => {
    const response = await api.get(`/api/social/following/${userId}`);
    return response.data;
  },

  // Discovery
  getSuggestedUsers: async (limit: number = 20) => {
    const response = await api.get(`/api/social/suggested-users?limit=${limit}`);
    return response.data;
  },

  searchUsers: async (query: string, limit: number = 20) => {
    const response = await api.get(`/api/social/search-users?query=${query}&limit=${limit}`);
    return response.data;
  },

  // Deck Posting
  createDeck: async (deckData: any) => {
    const response = await api.post('/api/social/decks', deckData);
    return response.data;
  },

  updateDeck: async (deckId: string, deckData: any) => {
    const response = await api.put(`/api/social/decks/${deckId}`, deckData);
    return response.data;
  },

  getDeck: async (deckId: string) => {
    const response = await api.get(`/api/social/decks/${deckId}`);
    return response.data;
  },

  deleteDeck: async (deckId: string) => {
    const response = await api.delete(`/api/social/decks/${deckId}`);
    return response.data;
  },

  likeDeck: async (deckId: string) => {
    const response = await api.post(`/api/social/decks/${deckId}/like`);
    return response.data;
  },

  saveDeck: async (deckId: string) => {
    const response = await api.post(`/api/social/decks/${deckId}/save`);
    return response.data;
  },

  // Personalized Feed
  getPersonalizedFeed: async (limit: number = 50, offset: number = 0) => {
    const response = await api.get(`/api/social/feed?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  getFeedInsights: async () => {
    const response = await api.get('/api/social/feed/insights');
    return response.data;
  },

  exploreSubjectFeed: async (subject: string, limit: number = 50) => {
    const response = await api.get(`/api/social/feed/explore/${subject}?limit=${limit}`);
    return response.data;
  },
};

// Stories API - 24-hour expiring status updates
export const storiesAPI = {
  // Create story
  createStory: async (storyData: any) => {
    const response = await api.post('/api/stories/', storyData);
    return response.data;
  },

  // Get stories
  getStoryFeed: async () => {
    const response = await api.get('/api/stories/feed');
    return response.data;
  },

  getMyStories: async () => {
    const response = await api.get('/api/stories/my-stories');
    return response.data;
  },

  getStory: async (storyId: string) => {
    const response = await api.get(`/api/stories/${storyId}`);
    return response.data;
  },

  // Mark viewed
  markStoryViewed: async (storyId: string) => {
    const response = await api.post(`/api/stories/${storyId}/view`);
    return response.data;
  },

  // Delete story
  deleteStory: async (storyId: string) => {
    const response = await api.delete(`/api/stories/${storyId}`);
    return response.data;
  },

  // Templates
  getStoryTemplates: async () => {
    const response = await api.get('/api/stories/templates/list');
    return response.data;
  },
};

// Achievements & Streaks API - Gamification system
export const achievementsAPI = {
  // Streaks
  getStreak: async () => {
    const response = await api.get('/api/achievements/streak');
    return response.data;
  },

  recordActivity: async (cardsReviewed: number = 0, timeSpentMinutes: number = 0) => {
    const response = await api.post('/api/achievements/streak/record-activity', {
      cards_reviewed: cardsReviewed,
      time_spent_minutes: timeSpentMinutes,
    });
    return response.data;
  },

  // Achievements
  getAchievementsList: async (category?: string) => {
    const params = category ? `?category=${category}` : '';
    const response = await api.get(`/api/achievements/list${params}`);
    return response.data;
  },

  getUnlockedAchievements: async () => {
    const response = await api.get('/api/achievements/unlocked');
    return response.data;
  },

  shareAchievementToStory: async (achievementId: string) => {
    const response = await api.post(`/api/achievements/share-to-story/${achievementId}`);
    return response.data;
  },

  // Leaderboards
  getStreakLeaderboard: async (limit: number = 50) => {
    const response = await api.get(`/api/achievements/leaderboard/streaks?limit=${limit}`);
    return response.data;
  },
};

// Notifications API - Real-time notifications
export const notificationsAPI = {
  // Get notifications
  getNotifications: async (limit: number = 50, offset: number = 0, unreadOnly: boolean = false, notificationType?: string) => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (unreadOnly) params.append('unread_only', 'true');
    if (notificationType) params.append('notification_type', notificationType);

    const response = await api.get(`/api/notifications/?${params}`);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/api/notifications/summary');
    return response.data;
  },

  // Mark as read
  markAsRead: async (notificationId: string) => {
    const response = await api.post(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/api/notifications/read-all');
    return response.data;
  },

  // Delete/Archive
  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  },

  clearAll: async () => {
    const response = await api.post('/api/notifications/clear-all');
    return response.data;
  },

  // Preferences
  getPreferences: async () => {
    const response = await api.get('/api/notifications/preferences');
    return response.data;
  },

  updatePreferences: async (preferences: any) => {
    const response = await api.put('/api/notifications/preferences', preferences);
    return response.data;
  },
};

// Comments API - Deck discussions
export const commentsAPI = {
  // Get comments
  getDeckComments: async (deckId: string, limit: number = 50, offset: number = 0, parentOnly: boolean = false) => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (parentOnly) params.append('parent_only', 'true');

    const response = await api.get(`/api/comments/deck/${deckId}?${params}`);
    return response.data;
  },

  getCommentReplies: async (commentId: string, limit: number = 50) => {
    const response = await api.get(`/api/comments/${commentId}/replies?limit=${limit}`);
    return response.data;
  },

  getCommentCount: async (deckId: string) => {
    const response = await api.get(`/api/comments/deck/${deckId}/count`);
    return response.data;
  },

  // Create comment
  createComment: async (deckId: string, content: string, parentCommentId?: string) => {
    const response = await api.post(`/api/comments/deck/${deckId}`, {
      content,
      parent_comment_id: parentCommentId,
    });
    return response.data;
  },

  // Update comment
  updateComment: async (commentId: string, content: string) => {
    const response = await api.put(`/api/comments/${commentId}`, { content });
    return response.data;
  },

  // Delete comment
  deleteComment: async (commentId: string) => {
    const response = await api.delete(`/api/comments/${commentId}`);
    return response.data;
  },

  // Like comment
  toggleLike: async (commentId: string) => {
    const response = await api.post(`/api/comments/${commentId}/like`);
    return response.data;
  },
};

// Duels API - Multiplayer flashcard battles
export const duelsAPI = {
  quickMatch: async () => {
    const response = await api.post('/api/duels/quick-match');
    return response.data;
  },

  challenge: async (username: string) => {
    const response = await api.post(`/api/duels/challenge/${username}`);
    return response.data;
  },

  joinRoom: async (roomId: string) => {
    const response = await api.post(`/api/duels/${roomId}/join`);
    return response.data;
  },

  getRoom: async (roomId: string) => {
    const response = await api.get(`/api/duels/${roomId}`);
    return response.data;
  },
};

// Messages API - Direct messaging
export const messagesAPI = {
  // Conversations
  getConversations: async (includeArchived: boolean = false) => {
    const params = includeArchived ? '?include_archived=true' : '';
    const response = await api.get(`/api/messages/conversations${params}`);
    return response.data;
  },

  getOrCreateConversation: async (otherUserId: string) => {
    const response = await api.get(`/api/messages/conversation/${otherUserId}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/messages/unread-count');
    return response.data;
  },

  // Messages
  getMessages: async (conversationId: string, limit: number = 50, offset: number = 0) => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await api.get(`/api/messages/conversation/${conversationId}/messages?${params}`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string, messageType: string = 'text', sharedDeckId?: string, sharedCardId?: string) => {
    const response = await api.post(`/api/messages/conversation/${conversationId}/send`, {
      content,
      message_type: messageType,
      shared_deck_id: sharedDeckId,
      shared_card_id: sharedCardId,
    });
    return response.data;
  },

  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/api/messages/message/${messageId}`);
    return response.data;
  },

  // Archive
  toggleArchive: async (conversationId: string) => {
    const response = await api.post(`/api/messages/conversation/${conversationId}/archive`);
    return response.data;
  },
};

// Reels API
export const reelsAPI = {
  getFeed: async (limit: number = 20, offset: number = 0) => {
    const response = await api.get(`/api/reels/feed?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  getMyReels: async (limit: number = 50, offset: number = 0) => {
    const response = await api.get(`/api/reels/my-reels?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  getSaved: async (limit: number = 50, offset: number = 0) => {
    const response = await api.get(`/api/reels/saved?limit=${limit}&offset=${offset}`);
    return response.data;
  },
};

export default api;
