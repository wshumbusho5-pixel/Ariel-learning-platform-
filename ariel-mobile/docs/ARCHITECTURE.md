# Ariel Mobile — Full Architecture Plan
> Principal engineering spec. Read this before writing any code.

---

## Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Expo SDK 52 (managed) | Push notifications, camera, video — no native build headaches |
| Routing | React Navigation v7 | Nested stacks + bottom tabs, lazy loading per feature |
| Server state | React Query v5 (TanStack) | Caching, background refetch, optimistic updates |
| Global state | Zustand v5 | Auth token + unread count only — nothing else is global |
| Styling | NativeWind v4 | Same Tailwind classes as the web app |
| Animations | Reanimated v3 + Moti | Card flips, XP popups, reel transitions |
| Video | expo-av | Reels playback |
| WebSockets | Native WS + custom base class | Duels, live, messages |
| HTTP | Axios | Mirrors web app's lib/api.ts exactly |
| Storage | AsyncStorage | Auth token persistence, feed cache |
| Testing | Jest + React Native Testing Library | Unit + integration |

---

## Full Directory Tree

```
ariel-mobile/
├── app.json                          # Expo config
├── babel.config.js                   # Babel + NativeWind plugin
├── metro.config.js                   # Metro bundler config
├── tsconfig.json
├── tailwind.config.js
├── .env.example                      # API_BASE_URL, WS_BASE_URL
├── package.json
│
├── src/
│   │
│   ├── shared/                       # THE ONLY cross-feature dependency layer
│   │   │                             # Foundation agent builds this first
│   │   │                             # All other agents READ from here, never WRITE
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts             # Axios instance + interceptors (Bearer token injection, 401 logout)
│   │   │   ├── endpoints.ts          # ALL /api/* URL constants — single source of truth
│   │   │   └── websocket.ts          # Base WebSocket manager (auto-reconnect, message queuing)
│   │   │
│   │   ├── auth/
│   │   │   ├── authStore.ts          # Zustand: { token, user, isLoading, login(), logout(), updateUser() }
│   │   │   ├── AuthGate.tsx          # HOC: redirects unauthenticated users to login
│   │   │   └── useAuth.ts            # Hook: returns { user, token, logout } — only way to read auth
│   │   │
│   │   ├── types/                    # Mirrors every Pydantic model in ariel-backend/app/models/
│   │   │   ├── user.ts               # User, AuthProvider enum, UserRole, EducationLevel
│   │   │   ├── card.ts               # Card, CardCreate, CardUpdate, CardVisibility enum
│   │   │   ├── deck.ts               # Deck, DeckPost, DeckVisibility enum
│   │   │   ├── gamification.ts       # Achievement, LevelInfo, DailyGoal, Leaderboard
│   │   │   ├── notification.ts       # Notification, NotificationType enum
│   │   │   ├── message.ts            # Message, Conversation, MessageType enum
│   │   │   ├── reel.ts               # ReelResponse, ReelCreate
│   │   │   ├── livestream.ts         # LiveStream, StreamStatus, StreamComment
│   │   │   ├── story.ts              # Story, StoryType, StoryVisibility enum
│   │   │   ├── challenge.ts          # Challenge, ChallengeWithProgress
│   │   │   ├── duel.ts               # DuelRoom, DuelResult, DuelMessage types
│   │   │   └── api.ts                # Generic PaginatedResponse<T>, ApiError
│   │   │
│   │   ├── hooks/
│   │   │   ├── useInfiniteList.ts    # Generic paginated list hook built on React Query
│   │   │   ├── usePushNotifications.ts # Expo push token registration → backend
│   │   │   ├── useWebSocket.ts       # Generic WebSocket hook (wraps websocket.ts)
│   │   │   └── useHaptics.ts         # Expo Haptics wrapper with presets
│   │   │
│   │   ├── components/               # UI primitives used by 2+ features
│   │   │   ├── ArielLoader.tsx       # Full-screen loading skeleton
│   │   │   ├── Avatar.tsx            # Profile picture + fallback initials
│   │   │   ├── Badge.tsx             # XP/level badge
│   │   │   ├── EmptyState.tsx        # Reusable empty list placeholder
│   │   │   ├── ErrorBoundary.tsx     # React Error Boundary
│   │   │   ├── KeyboardView.tsx      # Cross-platform keyboard avoiding
│   │   │   ├── SafeArea.tsx          # NativeWind-wrapped SafeAreaView
│   │   │   ├── Sheet.tsx             # Bottom sheet (@gorhom/bottom-sheet)
│   │   │   ├── SubjectTag.tsx        # Colored subject/topic pill
│   │   │   └── Toast.tsx             # In-app toast notifications
│   │   │
│   │   ├── navigation/
│   │   │   ├── RootNavigator.tsx     # Auth stack vs Main app switcher
│   │   │   ├── MainTabNavigator.tsx  # Bottom tabs: Feed | Deck | + | Duels | Profile
│   │   │   ├── navigationRef.ts      # Imperative navigation outside React tree
│   │   │   └── linking.ts            # Deep link configuration
│   │   │
│   │   ├── constants/
│   │   │   ├── queryKeys.ts          # React Query cache key namespaces
│   │   │   ├── subjects.ts           # Subject list + color map (mirrors web lib/subjects.ts)
│   │   │   └── theme.ts              # Color tokens, spacing scale, typography
│   │   │
│   │   └── utils/
│   │       ├── time.ts               # timeAgo, formatDate (mirrors web lib/time.ts)
│   │       ├── storage.ts            # AsyncStorage key constants + typed wrappers
│   │       └── haptics.ts            # Haptic feedback presets
│   │
│   ├── features/                     # ONE AGENT PER FOLDER — zero cross-imports between siblings
│   │   │
│   │   ├── auth/                     # ── AGENT A ──
│   │   │   ├── screens/
│   │   │   │   ├── WelcomeScreen.tsx
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── RegisterScreen.tsx
│   │   │   │   ├── OnboardingScreen.tsx      # Education level, subjects selection
│   │   │   │   └── ForgotPasswordScreen.tsx
│   │   │   ├── api/
│   │   │   │   └── authApi.ts                # register, login, oauthLogin, getMe, updateProfile
│   │   │   ├── hooks/
│   │   │   │   └── useLoginForm.ts
│   │   │   └── AuthNavigator.tsx             # Stack: Welcome → Login → Register → Onboarding
│   │   │
│   │   ├── feed/                     # ── AGENT B ──
│   │   │   ├── screens/
│   │   │   │   ├── FeedScreen.tsx            # Vertical card feed (For You / Following tabs)
│   │   │   │   ├── ActivityFeedScreen.tsx    # /api/activity/feed
│   │   │   │   └── TrendingScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── CardFeedItem.tsx          # Card display in feed with flip animation
│   │   │   │   ├── DeckPost.tsx              # Deck post: caption + card + actions
│   │   │   │   ├── StoriesRow.tsx            # Horizontal stories strip
│   │   │   │   ├── FeedTabs.tsx              # "For You" / "Following" switcher
│   │   │   │   └── CommentSheet.tsx          # Bottom sheet comments (uses shared/Sheet)
│   │   │   ├── api/
│   │   │   │   └── feedApi.ts                # getPersonalizedFeed, getFollowingFeed, getTrending
│   │   │   └── hooks/
│   │   │       ├── useFeed.ts
│   │   │       └── useCardInteraction.ts     # like, save, comment handlers with optimistic updates
│   │   │
│   │   ├── cards/                    # ── AGENT C ──
│   │   │   ├── screens/
│   │   │   │   ├── MyDeckScreen.tsx
│   │   │   │   ├── CreateCardScreen.tsx
│   │   │   │   ├── AIGenerateScreen.tsx      # Bulk AI card generation
│   │   │   │   ├── CramScreen.tsx            # Rapid-fire review mode
│   │   │   │   ├── SpacedRepetitionScreen.tsx # SM-2 due card queue
│   │   │   │   ├── DeckStatsScreen.tsx
│   │   │   │   └── CardDetailScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── FlashCard.tsx             # Flippable card with Reanimated spring
│   │   │   │   ├── QualityRater.tsx          # 0-5 rating buttons after flip
│   │   │   │   ├── DeckFilterBar.tsx         # Subject/topic/tag filters
│   │   │   │   ├── BulkCreateForm.tsx
│   │   │   │   └── ProgressRing.tsx          # SVG circular progress
│   │   │   ├── api/
│   │   │   │   └── cardsApi.ts               # createCard, bulkCreate, getDue, review, like, save
│   │   │   └── hooks/
│   │   │       ├── useMyDeck.ts
│   │   │       ├── useCramSession.ts
│   │   │       └── useSpacedRepetition.ts    # Offline-first: queues ratings in AsyncStorage
│   │   │
│   │   ├── duels/                    # ── AGENT D ──
│   │   │   ├── screens/
│   │   │   │   ├── DuelsLobbyScreen.tsx      # Find duel / matchmaking
│   │   │   │   ├── DuelRoomScreen.tsx        # Live game (WebSocket)
│   │   │   │   └── DuelResultScreen.tsx      # Score + XP earned
│   │   │   ├── components/
│   │   │   │   ├── DuelCard.tsx              # Question + timer bar
│   │   │   │   ├── PlayerStats.tsx           # Both players side by side
│   │   │   │   ├── CountdownTimer.tsx        # Animated 15s countdown
│   │   │   │   ├── MatchmakingSpinner.tsx
│   │   │   │   └── DuelResultCard.tsx
│   │   │   ├── api/
│   │   │   │   └── duelsApi.ts               # createRoom, joinRoom, getRoom
│   │   │   ├── hooks/
│   │   │   │   └── useDuelSocket.ts          # WS: round_start, answer_submitted, round_result, game_over
│   │   │   └── DuelsNavigator.tsx
│   │   │
│   │   ├── profile/                  # ── AGENT E ──
│   │   │   ├── screens/
│   │   │   │   ├── MyProfileScreen.tsx
│   │   │   │   ├── UserProfileScreen.tsx     # Other user's public profile
│   │   │   │   ├── EditProfileScreen.tsx
│   │   │   │   ├── FollowersScreen.tsx
│   │   │   │   ├── FollowingScreen.tsx
│   │   │   │   └── SettingsScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── ProfileHeader.tsx         # Avatar, stats, follow button
│   │   │   │   ├── UserDeckGrid.tsx          # Grid of public decks
│   │   │   │   ├── StatsRow.tsx              # Followers / Following / Points
│   │   │   │   └── AchievementBadges.tsx
│   │   │   ├── api/
│   │   │   │   └── profileApi.ts             # getUserProfile, follow, unfollow, getFollowers
│   │   │   └── hooks/
│   │   │       └── useProfile.ts
│   │   │
│   │   ├── gamification/             # ── AGENT F ──
│   │   │   ├── screens/
│   │   │   │   ├── LeaderboardScreen.tsx
│   │   │   │   ├── AchievementsScreen.tsx
│   │   │   │   ├── ChallengesScreen.tsx
│   │   │   │   └── StatsScreen.tsx           # Daily goal, streak history
│   │   │   ├── components/
│   │   │   │   ├── XPBar.tsx
│   │   │   │   ├── StreakCounter.tsx
│   │   │   │   ├── AchievementCard.tsx
│   │   │   │   ├── LeaderboardRow.tsx
│   │   │   │   ├── DailyGoalRing.tsx
│   │   │   │   ├── ChallengeCard.tsx
│   │   │   │   └── XPPopup.tsx               # Animated "+XP" overlay
│   │   │   ├── api/
│   │   │   │   └── gamificationApi.ts        # getLevelInfo, getAchievements, getDailyGoal, getLeaderboard
│   │   │   └── hooks/
│   │   │       └── useGamification.ts
│   │   │
│   │   ├── messages/                 # ── AGENT G ──
│   │   │   ├── screens/
│   │   │   │   ├── ConversationsScreen.tsx   # Inbox list
│   │   │   │   ├── ChatScreen.tsx            # DM thread
│   │   │   │   └── NewMessageScreen.tsx      # User search to start DM
│   │   │   ├── components/
│   │   │   │   ├── ConversationRow.tsx       # Last message preview
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── MessageInput.tsx          # Keyboard-aware
│   │   │   │   └── UnreadBadge.tsx
│   │   │   ├── api/
│   │   │   │   └── messagesApi.ts            # getConversations, getMessages, sendMessage, markRead
│   │   │   └── hooks/
│   │   │       ├── useConversations.ts
│   │   │       └── useChatSocket.ts          # Real-time messages via WebSocket
│   │   │
│   │   ├── notifications/            # ── AGENT H ──
│   │   │   ├── screens/
│   │   │   │   └── NotificationsScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── NotificationRow.tsx
│   │   │   │   └── NotificationGroupHeader.tsx  # "Today" / "Earlier" dividers
│   │   │   ├── api/
│   │   │   │   └── notificationsApi.ts       # getNotifications, markRead, markAllRead
│   │   │   ├── hooks/
│   │   │   │   └── useNotifications.ts
│   │   │   └── notificationStore.ts          # Zustand: unread count for badge
│   │   │
│   │   ├── reels/                    # ── AGENT I ──
│   │   │   ├── screens/
│   │   │   │   ├── ReelsScreen.tsx           # Full-screen vertical video scroll
│   │   │   │   └── CreateReelScreen.tsx      # Record / upload video
│   │   │   ├── components/
│   │   │   │   ├── ReelPlayer.tsx            # expo-av Video wrapper
│   │   │   │   ├── ReelOverlay.tsx           # Like/comment/share buttons on top of video
│   │   │   │   ├── ReelCommentSheet.tsx
│   │   │   │   └── ReelThumbnail.tsx
│   │   │   ├── api/
│   │   │   │   └── reelsApi.ts               # getReels, getReelById, likeReel, uploadReel
│   │   │   └── hooks/
│   │   │       ├── useReels.ts
│   │   │       └── useReelPlayer.ts          # Play/pause on scroll visibility
│   │   │
│   │   ├── live/                     # ── AGENT J ──
│   │   │   ├── screens/
│   │   │   │   ├── LiveListScreen.tsx        # Active streams list
│   │   │   │   ├── LiveViewerScreen.tsx      # Watch stream (WebSocket viewer)
│   │   │   │   └── LiveHostScreen.tsx        # Host stream (WebSocket + WebRTC)
│   │   │   ├── components/
│   │   │   │   ├── LiveCard.tsx              # Stream preview card
│   │   │   │   ├── ViewerCount.tsx
│   │   │   │   ├── LiveChat.tsx              # Real-time comments
│   │   │   │   ├── LiveReactionBar.tsx       # Floating emoji reactions
│   │   │   │   └── StreamControls.tsx        # Host: mic/camera/end
│   │   │   ├── api/
│   │   │   │   └── liveApi.ts                # createStream, getActiveStreams, endStream
│   │   │   └── hooks/
│   │   │       └── useLiveSocket.ts          # WS: /api/livestream/ws/{streamId}
│   │   │
│   │   ├── discover/                 # ── AGENT K ──
│   │   │   ├── screens/
│   │   │   │   ├── DiscoverScreen.tsx        # Browse subjects + trending decks
│   │   │   │   ├── SearchScreen.tsx          # Search: cards, decks, users
│   │   │   │   └── SubjectScreen.tsx         # All decks for one subject
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── SubjectGrid.tsx           # Colorful subject tiles
│   │   │   │   ├── DeckSearchResult.tsx
│   │   │   │   └── UserSearchResult.tsx
│   │   │   ├── api/
│   │   │   │   └── discoverApi.ts            # searchCards, searchDecks, searchUsers, getSuggestedUsers
│   │   │   └── hooks/
│   │   │       └── useSearch.ts
│   │   │
│   │   └── stories/                  # ── AGENT L ──
│   │       ├── screens/
│   │       │   └── StoryViewerScreen.tsx
│   │       ├── components/
│   │       │   ├── StoryRing.tsx             # Avatar with colored ring
│   │       │   ├── StoryViewer.tsx           # Tappable story with progress bars
│   │       │   ├── StoryCreateSheet.tsx
│   │       │   └── StoryProgressBar.tsx
│   │       ├── api/
│   │       │   └── storiesApi.ts             # getStories, createStory, viewStory
│   │       └── hooks/
│   │           └── useStories.ts
│   │
│   └── app/
│       └── index.tsx                 # Root: <QueryClientProvider> + <NavigationContainer>
│
├── docs/
│   └── ARCHITECTURE.md               # This file
│
└── __tests__/
    ├── shared/
    └── features/
```

---

## Agent Ownership Map

**RULE: Features import only from `shared/`. Never from sibling features.**

| Agent | Owns | API Routes |
|---|---|---|
| **Foundation** | `src/shared/`, `src/app/index.tsx`, all config files | N/A |
| **A — Auth** | `src/features/auth/` | `/api/auth/*` |
| **B — Feed** | `src/features/feed/` | `/api/cards/personalized-feed`, `/api/cards/following-feed`, `/api/cards/trending`, `/api/activity/feed`, `/api/social/feed` |
| **C — Cards** | `src/features/cards/` | `/api/cards/*`, `/api/ai/*`, `/api/progress/*` |
| **D — Duels** | `src/features/duels/` | `/api/duels/*`, `ws://*/api/duels/ws/*` |
| **E — Profile** | `src/features/profile/` | `/api/social/profile/*`, `/api/social/follow`, `/api/social/suggested-users` |
| **F — Gamification** | `src/features/gamification/` | `/api/gamification/*`, `/api/challenges/*`, `/api/achievements/*` |
| **G — Messages** | `src/features/messages/` | `/api/messages/*` |
| **H — Notifications** | `src/features/notifications/` | `/api/notifications/*` |
| **I — Reels** | `src/features/reels/` | `/api/reels/*` |
| **J — Live** | `src/features/live/` | `/api/livestream/*`, `ws://*/api/livestream/ws/*` |
| **K — Discover** | `src/features/discover/` | `/api/cards/search`, `/api/social/search-users` |
| **L — Stories** | `src/features/stories/` | `/api/stories/*` |

### Hard Isolation Rules

1. `features/feed/` must NEVER import from `features/cards/`. The feed uses `shared/types/card.ts` and its own local `CardFeedItem.tsx` — not the cards feature's `FlashCard.tsx`.
2. If a component is needed by 2+ features, it MUST live in `shared/components/` — never duplicated.
3. A feature adds its navigator to `MainTabNavigator.tsx` via a single named import only.
4. Feature `api/` files are thin wrappers over `shared/api/client.ts`. No second Axios instance, no interceptors.
5. Only `shared/auth/authStore.ts` may call `logout()`. Features call the `useAuth()` hook.

---

## Data Flow

### Auth Token Flow
```
App startup
  → AsyncStorage (Zustand persist middleware hydrates authStore automatically)
  → shared/api/client.ts interceptor reads token on every request
  → 401 response → authStore.logout() → RootNavigator re-renders → Auth stack
```

### React Query Config (src/app/index.tsx)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // 30s — data stays fresh
      gcTime: 5 * 60_000,         // 5min garbage collection
      retry: 2,
      refetchOnWindowFocus: true, // refetch when app comes to foreground
    }
  }
});
```

### Query Key Namespacing (shared/constants/queryKeys.ts)
```typescript
export const QUERY_KEYS = {
  FEED: {
    PERSONALIZED: (userId: string) => ['feed', 'personalized', userId],
    FOLLOWING:    (userId: string) => ['feed', 'following', userId],
    TRENDING:                        ['feed', 'trending'],
  },
  CARDS: {
    DUE:     (userId: string) => ['cards', 'due', userId],
    MY_DECK: (userId: string) => ['cards', 'deck', userId],
    DETAIL:  (cardId: string) => ['cards', 'detail', cardId],
  },
  GAMIFICATION: {
    LEVEL: (userId: string) => ['gamification', 'level', userId],
    LEADERBOARD:               ['gamification', 'leaderboard'],
  },
  NOTIFICATIONS: {
    LIST: (userId: string) => ['notifications', userId],
  },
  // ... etc
}
```

### Optimistic Update Pattern (all like/follow/comment)
```typescript
// In every useCardInteraction.ts, useProfile.ts etc:
const mutation = useMutation({
  mutationFn: api.likeCard,
  onMutate: async (cardId) => {
    await queryClient.cancelQueries({ queryKey: QUERY_KEYS.FEED.PERSONALIZED(userId) });
    const snapshot = queryClient.getQueryData(...);
    queryClient.setQueryData(..., optimisticUpdate);  // instant UI update
    return { snapshot };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(..., context.snapshot);  // rollback
  },
  onSettled: () => {
    queryClient.invalidateQueries(...);               // sync with server
  },
});
```

### WebSocket Architecture
```
shared/api/websocket.ts: BaseWebSocketManager
  - connect(url): appends ?token=<JWT>
  - onMessage(handler): returns cleanup function
  - send(data): queues if not yet connected
  - auto-reconnect with exponential backoff (max 3 retries)

Feature hooks:
  features/duels/hooks/useDuelSocket.ts
    → ws://API/api/duels/ws/{roomId}?token={token}
    → events: round_start | answer_submitted | round_result | game_over

  features/live/hooks/useLiveSocket.ts
    → ws://API/api/livestream/ws/{streamId}?token={token}
    → events: viewer_joined | chat_message | reaction | stream_ended

  features/messages/hooks/useChatSocket.ts
    → polling fallback via React Query if WebSocket unavailable
```

### Tab Navigation Structure
```
RootNavigator
  ├── !token          → features/auth/AuthNavigator
  └── token
      ├── !onboarding_completed → features/auth/OnboardingScreen
      └── onboarding_completed  → MainTabNavigator (bottom tabs)
          ├── Tab 1: Feed      → features/feed/FeedScreen
          ├── Tab 2: Deck      → features/cards/MyDeckScreen
          ├── Tab 3: Create+   → features/cards/AIGenerateScreen (modal)
          ├── Tab 4: Duels     → features/duels/DuelsLobbyScreen
          └── Tab 5: Profile   → features/profile/MyProfileScreen

Modal screens (presented above tabs):
  - features/reels/ReelsScreen
  - features/live/LiveViewerScreen
  - features/stories/StoryViewerScreen
  - features/messages/ChatScreen
  - features/notifications/NotificationsScreen
  - features/discover/SearchScreen
```

---

## Build Order (Critical Path)

### Phase 0 — Foundation (ALL agents blocked until this is done)
1. `package.json` — all dependencies locked
2. `src/shared/types/*` — all 12 type files (mirror Pydantic models)
3. `src/shared/api/client.ts` + `endpoints.ts` — HTTP client
4. `src/shared/auth/authStore.ts` — Zustand + AsyncStorage persistence
5. `src/shared/navigation/RootNavigator.tsx` + `MainTabNavigator.tsx`
6. `src/app/index.tsx` — QueryClient + NavigationContainer root
7. `src/shared/constants/queryKeys.ts`

### Phase 1 — Auth (unblocks all agents who need to test API calls)
- `src/features/auth/` — Login, Register, Onboarding screens working end-to-end

### Phase 2 — Core Loop (parallel, after Phase 1)
- **Agent B (Feed)** + **Agent C (Cards)** simultaneously
- These are the core product loop — everything else supports them

### Phase 3 — All remaining agents in full parallel
- Agents D, E, F, G, H, I, J, K, L — all simultaneously
- Each owns a sealed domain, zero inter-agent dependencies

---

## Key Backend Files to Reference

| Backend file | Why mobile agents need it |
|---|---|
| `ariel-backend/app/models/user.py` | Source of truth for `shared/types/user.ts` — all fields and enums |
| `ariel-backend/app/main.py` | Complete router registry — populate `shared/api/endpoints.ts` from here |
| `ariel-backend/app/api/duels.py` | WebSocket message protocol for Agent D |
| `ariel-backend/app/api/livestream.py` | WebSocket message protocol for Agent J |
| `ariel-backend/app/core/config.py` | CORS config — confirms `localhost:19006` is allowed |
| `ariel-web/lib/api.ts` | Direct template for `shared/api/client.ts` — port interceptor logic |
| `ariel-web/lib/subjects.ts` | Port to `shared/constants/subjects.ts` |
| `ariel-web/lib/time.ts` | Port to `shared/utils/time.ts` |
