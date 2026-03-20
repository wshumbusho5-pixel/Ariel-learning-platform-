// All React Query cache keys as typed factory functions

export const QUERY_KEYS = {
  // Feed
  FEED: {
    all: () => ['feed'] as const,
    personalized: (offset?: number) => ['feed', 'personalized', offset] as const,
    following: (offset?: number) => ['feed', 'following', offset] as const,
    trending: () => ['feed', 'trending'] as const,
    insights: () => ['feed', 'insights'] as const,
  },

  // Cards
  CARDS: {
    all: () => ['cards'] as const,
    myDeck: (filters?: Record<string, unknown>) => ['cards', 'my-deck', filters] as const,
    due: (limit?: number) => ['cards', 'due', limit] as const,
    detail: (id: string) => ['cards', 'detail', id] as const,
    stats: () => ['cards', 'stats'] as const,
    search: (query: string) => ['cards', 'search', query] as const,
  },

  // Gamification
  GAMIFICATION: {
    level: () => ['gamification', 'level'] as const,
    achievements: () => ['gamification', 'achievements'] as const,
    dailyGoal: () => ['gamification', 'daily-goal'] as const,
    stats: () => ['gamification', 'stats'] as const,
  },

  // Notifications
  NOTIFICATIONS: {
    all: (params?: Record<string, unknown>) => ['notifications', params] as const,
    summary: () => ['notifications', 'summary'] as const,
    preferences: () => ['notifications', 'preferences'] as const,
  },

  // Messages
  MESSAGES: {
    conversations: () => ['messages', 'conversations'] as const,
    conversation: (id: string) => ['messages', 'conversation', id] as const,
    messages: (convId: string, offset?: number) => ['messages', 'messages', convId, offset] as const,
    unreadCount: () => ['messages', 'unread-count'] as const,
  },

  // Profile
  PROFILE: {
    me: () => ['profile', 'me'] as const,
    user: (id: string) => ['profile', 'user', id] as const,
    followers: (id: string) => ['profile', 'followers', id] as const,
    following: (id: string) => ['profile', 'following', id] as const,
    suggested: () => ['profile', 'suggested'] as const,
  },

  // Duels
  DUELS: {
    room: (id: string) => ['duels', 'room', id] as const,
  },

  // Reels
  REELS: {
    feed: (offset?: number) => ['reels', 'feed', offset] as const,
    my: (offset?: number) => ['reels', 'my', offset] as const,
    saved: (offset?: number) => ['reels', 'saved', offset] as const,
  },

  // Stories
  STORIES: {
    feed: () => ['stories', 'feed'] as const,
    my: () => ['stories', 'my'] as const,
    detail: (id: string) => ['stories', 'detail', id] as const,
  },

  // Live
  LIVE: {
    discover: (params?: Record<string, unknown>) => ['live', 'discover', params] as const,
    my: () => ['live', 'my'] as const,
    detail: (id: string) => ['live', 'detail', id] as const,
  },

  // Discover / Social
  DISCOVER: {
    social: (offset?: number) => ['discover', 'social', offset] as const,
    deck: (id: string) => ['discover', 'deck', id] as const,
    explore: (subject: string, limit?: number) => ['discover', 'explore', subject, limit] as const,
    searchUsers: (query: string) => ['discover', 'search-users', query] as const,
  },

  // Achievements
  ACHIEVEMENTS: {
    streak: () => ['achievements', 'streak'] as const,
    list: (category?: string) => ['achievements', 'list', category] as const,
    unlocked: () => ['achievements', 'unlocked'] as const,
    leaderboard: () => ['achievements', 'leaderboard'] as const,
  },

  // Challenges
  CHALLENGES: {
    all: () => ['challenges'] as const,
    active: () => ['challenges', 'active'] as const,
    detail: (id: string) => ['challenges', 'detail', id] as const,
    leaderboard: (id: string) => ['challenges', 'leaderboard', id] as const,
  },

  // Comments
  COMMENTS: {
    deck: (deckId: string) => ['comments', 'deck', deckId] as const,
    replies: (commentId: string) => ['comments', 'replies', commentId] as const,
  },
} as const;
