const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://ariel-learning-platform-production.up.railway.app';
const WS_BASE_URL =
  process.env.EXPO_PUBLIC_WS_BASE_URL ?? API_BASE_URL.replace(/^http/, 'ws');

// ─── Auth (/api/auth) ──────────────────────────────────────────────────────────
export const AUTH = {
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  OAUTH_LOGIN: '/api/auth/oauth/login',
  ME: '/api/auth/me',
  PROFILE: '/api/auth/profile',
  PROFILE_PICTURE: '/api/auth/profile/picture',
  HEARTBEAT: '/api/auth/heartbeat',
} as const;

// ─── Cards (/api/cards) ────────────────────────────────────────────────────────
export const CARDS = {
  CREATE: '/api/cards/',
  BULK: '/api/cards/bulk',
  MY_DECK: '/api/cards/my-deck',
  DUE: '/api/cards/due',
  FOLLOWING_FEED: '/api/cards/following-feed',
  TRENDING: '/api/cards/trending',
  PERSONALIZED_FEED: '/api/cards/personalized-feed',
  FEED_INSIGHTS: '/api/cards/feed-insights',
  STATS: '/api/cards/stats',
  SEARCH: '/api/cards/search',
  byId: (id: string) => `/api/cards/${id}`,
  review: (id: string) => `/api/cards/${id}/review`,
  like: (id: string) => `/api/cards/${id}/like`,
  save: (id: string) => `/api/cards/${id}/save`,
} as const;

// ─── Progress (/api/progress) ─────────────────────────────────────────────────
export const PROGRESS = {
  CARDS: '/api/progress/cards',
  DUE: '/api/progress/cards/due',
  REVIEWS: '/api/progress/reviews',
  STATS: '/api/progress/stats',
} as const;

// ─── Gamification (/api/gamification) ────────────────────────────────────────
export const GAMIFICATION = {
  LEVEL: '/api/gamification/level',
  ACHIEVEMENTS: '/api/gamification/achievements',
  DAILY_GOAL: '/api/gamification/daily-goal',
  STATS: '/api/gamification/stats',
} as const;

// ─── Social (/api/social) ────────────────────────────────────────────────────
export const SOCIAL = {
  FOLLOW: (userId: string) => `/api/social/users/${userId}/follow`,
  PROFILE: (userId: string) => `/api/social/profile/${userId}`,
  FOLLOWERS: (userId: string) => `/api/social/followers/${userId}`,
  FOLLOWING: (userId: string) => `/api/social/following/${userId}`,
  SUGGESTED_USERS: '/api/social/suggested-users',
  SEARCH_USERS: '/api/social/search-users',
  DECKS: '/api/social/decks',
  DECK_BY_ID: (deckId: string) => `/api/social/decks/${deckId}`,
  DECK_LIKE: (deckId: string) => `/api/social/decks/${deckId}/like`,
  DECK_SAVE: (deckId: string) => `/api/social/decks/${deckId}/save`,
  FEED: '/api/social/feed',
  FEED_INSIGHTS: '/api/social/feed/insights',
  EXPLORE_SUBJECT: (subject: string) => `/api/social/feed/explore/${subject}`,
} as const;

// ─── Stories (/api/stories) ───────────────────────────────────────────────────
export const STORIES = {
  CREATE: '/api/stories/',
  FEED: '/api/stories/feed',
  MY_STORIES: '/api/stories/my-stories',
  TEMPLATES: '/api/stories/templates/list',
  byId: (id: string) => `/api/stories/${id}`,
  view: (id: string) => `/api/stories/${id}/view`,
} as const;

// ─── Achievements (/api/achievements) ────────────────────────────────────────
export const ACHIEVEMENTS = {
  STREAK: '/api/achievements/streak',
  RECORD_ACTIVITY: '/api/achievements/streak/record-activity',
  LIST: '/api/achievements/list',
  UNLOCKED: '/api/achievements/unlocked',
  SHARE_TO_STORY: (id: string) => `/api/achievements/share-to-story/${id}`,
  LEADERBOARD_STREAKS: '/api/achievements/leaderboard/streaks',
} as const;

// ─── Notifications (/api/notifications) ──────────────────────────────────────
export const NOTIFICATIONS = {
  LIST: '/api/notifications/',
  SUMMARY: '/api/notifications/summary',
  READ_ALL: '/api/notifications/read-all',
  CLEAR_ALL: '/api/notifications/clear-all',
  PREFERENCES: '/api/notifications/preferences',
  markRead: (id: string) => `/api/notifications/${id}/read`,
  delete: (id: string) => `/api/notifications/${id}`,
} as const;

// ─── Comments (/api/comments) ─────────────────────────────────────────────────
export const COMMENTS = {
  DECK: (deckId: string) => `/api/comments/deck/${deckId}`,
  DECK_COUNT: (deckId: string) => `/api/comments/deck/${deckId}/count`,
  CARD: (cardId: string) => `/api/comments/card/${cardId}`,
  REPLIES: (commentId: string) => `/api/comments/${commentId}/replies`,
  byId: (id: string) => `/api/comments/${id}`,
  like: (id: string) => `/api/comments/${id}/like`,
} as const;

// ─── Messages (/api/messages) ─────────────────────────────────────────────────
export const MESSAGES = {
  CONVERSATIONS: '/api/messages/conversations',
  UNREAD_COUNT: '/api/messages/unread-count',
  CONVERSATION: (userId: string) => `/api/messages/conversation/${userId}`,
  CONVERSATION_MESSAGES: (convId: string) => `/api/messages/conversation/${convId}/messages`,
  SEND: (convId: string) => `/api/messages/conversation/${convId}/send`,
  DELETE_MESSAGE: (msgId: string) => `/api/messages/message/${msgId}`,
  REACT: (msgId: string) => `/api/messages/message/${msgId}/react`,
  ARCHIVE: (convId: string) => `/api/messages/conversation/${convId}/archive`,
} as const;

// ─── Reels (/api/reels) ───────────────────────────────────────────────────────
export const REELS = {
  FEED: '/api/reels/feed',
  MY_REELS: '/api/reels/my-reels',
  SAVED: '/api/reels/saved',
  SIGN_UPLOAD: '/api/reels/sign-upload',
  SAVE: '/api/reels/save',
  byId: (id: string) => `/api/reels/${id}`,
} as const;

// ─── Livestream (/api/livestream) ────────────────────────────────────────────
export const LIVESTREAM = {
  CREATE: '/api/livestream/create',
  DISCOVER: '/api/livestream/discover',
  MY_STREAMS: '/api/livestream/my-streams',
  byId: (id: string) => `/api/livestream/${id}`,
  start: (id: string) => `/api/livestream/${id}/start`,
  end: (id: string) => `/api/livestream/${id}/end`,
  like: (id: string) => `/api/livestream/${id}/like`,
  WS: (streamId: string) => `${WS_BASE_URL}/api/livestream/${streamId}/ws`,
} as const;

// ─── Duels (/api/duels) ───────────────────────────────────────────────────────
export const DUELS = {
  QUICK_MATCH: '/api/duels/quick-match',
  CHALLENGE: (username: string) => `/api/duels/challenge/${username}`,
  JOIN: (roomId: string) => `/api/duels/${roomId}/join`,
  ROOM: (roomId: string) => `/api/duels/${roomId}`,
  WS: (roomId: string) => `${WS_BASE_URL}/api/duels/${roomId}/ws`,
} as const;

// ─── AI (/api/ai) ─────────────────────────────────────────────────────────────
export const AI = {
  GENERATE_SUBJECT: '/api/ai/generate/subject',
  GENERATE_DAILY: '/api/ai/generate/daily',
  GENERATE_EXAM_PREP: '/api/ai/generate/exam-prep',
  SUBJECTS: '/api/ai/subjects',
  CHAT: '/api/ai/chat',
  COMPLETE: '/api/ai/complete',
  CAPTION: '/api/ai/caption',
  CREDENTIALS: '/api/ai/credentials',
} as const;

// ─── Challenges ───────────────────────────────────────────────────────────────
export const CHALLENGES = {
  LIST: '/api/challenges/',
  ACTIVE: '/api/challenges/active',
  byId: (id: string) => `/api/challenges/${id}`,
  join: (id: string) => `/api/challenges/${id}/join`,
  LEADERBOARD: (id: string) => `/api/challenges/${id}/leaderboard`,
} as const;

export { WS_BASE_URL, API_BASE_URL };
