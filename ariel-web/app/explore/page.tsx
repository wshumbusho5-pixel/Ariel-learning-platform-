'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { cardsAPI, socialAPI } from '@/lib/api';

interface UserResult {
  id: string;
  username: string;
  full_name?: string;
  profile_picture?: string;
  bio?: string;
  is_following: boolean;
  is_teacher?: boolean;
  is_verified?: boolean;
}

interface Card {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  tags: string[];
  likes: number;
  saves: number;
  comments_count?: number;
  visibility: string;
  created_by?: {
    id?: string;
    username: string;
    profile_picture?: string;
  };
}

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const subjectFilter = searchParams.get('subject');
  const topicFilter = searchParams.get('topic');

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [followingCreators, setFollowingCreators] = useState<Set<string>>(new Set());
  const [feedMode, setFeedMode] = useState<'personalized' | 'trending'>('personalized');
  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [peopleResults, setPeopleResults] = useState<UserResult[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    loadCards();
  }, [feedMode, subjectFilter, topicFilter]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = feedMode === 'personalized'
        ? await cardsAPI.getPersonalizedFeed(100)
        : await cardsAPI.getTrendingCards(100);

      // Filter by subject/topic if coming from dashboard
      const filter = topicFilter || subjectFilter;
      if (filter) {
        const keyword = filter.toLowerCase();
        const filtered = data.filter((c: Card) =>
          (c.subject || '').toLowerCase().includes(keyword) ||
          (c.topic || '').toLowerCase().includes(keyword) ||
          (c.tags || []).some((t: string) => t.toLowerCase().includes(keyword))
        );
        setCards(filtered.length > 0 ? filtered : data);
      } else {
        setCards(data);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
      try {
        const fallback = await cardsAPI.getTrendingCards(50);
        setCards(fallback);
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) {
      setPeopleResults([]);
      return;
    }
    setSearchingPeople(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await socialAPI.searchUsers(q.trim());
        setPeopleResults(results);
      } catch {}
      finally { setSearchingPeople(false); }
    }, 350);
  };

  const handleToggleFollow = async (userId: string) => {
    const user = peopleResults.find(u => u.id === userId);
    if (!user) return;
    try {
      if (user.is_following) {
        await socialAPI.unfollowUser(userId);
      } else {
        await socialAPI.followUser(userId);
      }
      setPeopleResults(prev => prev.map(u =>
        u.id === userId ? { ...u, is_following: !u.is_following } : u
      ));
      // also update the card feed follow state
      setFollowingCreators(prev => {
        const next = new Set(prev);
        if (user.is_following) next.delete(userId); else next.add(userId);
        return next;
      });
    } catch {}
  };

  const isSearchMode = searchFocused || searchQuery.length > 0;

  const handleLike = async (cardId: string) => {
    const isCurrentlyLiked = likedCards.has(cardId);

    try {
      await cardsAPI.likeCard(cardId);

      const newLikedCards = new Set(likedCards);
      if (isCurrentlyLiked) {
        newLikedCards.delete(cardId);
      } else {
        newLikedCards.add(cardId);
      }
      setLikedCards(newLikedCards);

      setCards(cards.map(card =>
        card.id === cardId
          ? { ...card, likes: isCurrentlyLiked ? Math.max(0, card.likes - 1) : card.likes + 1 }
          : card
      ));
    } catch (error) {
      console.error('Failed to like card:', error);
    }
  };

  const handleFollow = async (userId?: string) => {
    if (!userId) return;
    const isFollowing = followingCreators.has(userId);
    try {
      if (isFollowing) {
        await socialAPI.unfollowUser(userId);
        setFollowingCreators((prev) => { const next = new Set(prev); next.delete(userId); return next; });
      } else {
        await socialAPI.followUser(userId);
        setFollowingCreators((prev) => new Set(prev).add(userId));
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  const handleSave = async (cardId: string) => {
    const isCurrentlySaved = savedCards.has(cardId);

    try {
      await cardsAPI.saveCardToDeck(cardId);

      const newSavedCards = new Set(savedCards);
      if (isCurrentlySaved) {
        newSavedCards.delete(cardId);
      } else {
        newSavedCards.add(cardId);
      }
      setSavedCards(newSavedCards);

      setCards(cards.map(card =>
        card.id === cardId
          ? { ...card, saves: isCurrentlySaved ? Math.max(0, card.saves - 1) : card.saves + 1 }
          : card
      ));
    } catch (error) {
      console.error('Failed to save card:', error);
    }
  };

  // Swipe detection for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 150) {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      }
    }

    if (touchStart - touchEnd < -150) {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setShowAnswer(false);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setShowAnswer(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setShowAnswer(!showAnswer);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, cards.length, showAnswer]);

  if (loading) {
    return (
      <div className="h-screen bg-[#09090b] flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#09090b] border-b border-zinc-800 relative flex-shrink-0">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-transparent pointer-events-none" />
          <div className="px-4 py-4">
            <h1 className="text-2xl font-black text-white tracking-tight">Explore</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">Discover cards from the community</p>
          </div>
          <div className="px-4 pb-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex gap-1">
              <div className="flex-1 h-9 bg-zinc-800 rounded-lg" />
              <div className="flex-1 h-9 rounded-lg" />
            </div>
          </div>
        </header>
        <div className="flex-1 px-4 pt-4 space-y-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-[#1e1e22] animate-pulse p-5">
              <div className="space-y-3">
                <div className="h-3 bg-zinc-800 rounded w-1/4" />
                <div className="h-4 bg-zinc-800 rounded w-4/5" />
                <div className="h-4 bg-zinc-800 rounded w-3/5" />
                <div className="border-t border-zinc-800/60 my-3" />
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
                <div className="flex gap-3 mt-2">
                  <div className="h-3 bg-zinc-800 rounded w-12" />
                  <div className="h-3 bg-zinc-800 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="h-screen bg-[#09090b] flex flex-col overflow-hidden">
        <header className="sticky top-0 z-40 bg-[#09090b] border-b border-zinc-800 relative flex-shrink-0">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-transparent pointer-events-none" />
          <div className="px-4 py-4">
            <h1 className="text-2xl font-black text-white tracking-tight">Explore</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">Discover cards from the community</p>
          </div>
          <div className="px-4 pb-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setFeedMode('personalized')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  feedMode === 'personalized'
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                For You
              </button>
              <button
                onClick={() => setFeedMode('trending')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  feedMode === 'trending'
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Trending
              </button>
            </div>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-white mb-2">No cards found</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">Try switching to Trending or check back later as the community grows.</p>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isLiked = likedCards.has(currentCard.id);
  const isSaved = savedCards.has(currentCard.id);

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full bg-[#09090b] overflow-hidden page-enter"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50">
        {/* Violet crown line */}
        <div className="h-[3px] bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-transparent pointer-events-none" />
        <div className="bg-[#09090b] border-b border-zinc-800">
          <div className="px-4 pt-3 pb-2 flex items-center gap-3">
            {!isSearchMode && <h1 className="text-2xl font-black text-white tracking-tight flex-1">Explore</h1>}
            {/* Search bar */}
            <div className={`flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 h-10 transition-all ${isSearchMode ? 'flex-1' : 'w-10 cursor-pointer'}`}
              onClick={() => { if (!isSearchMode) { setSearchFocused(true); searchRef.current?.focus(); } }}>
              <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isSearchMode && (
                <input
                  ref={searchRef}
                  autoFocus
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Search people..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                />
              )}
            </div>
            {isSearchMode && (
              <button
                onClick={() => { setSearchQuery(''); setSearchFocused(false); setPeopleResults([]); }}
                className="text-xs text-zinc-400 font-semibold flex-shrink-0"
              >
                Cancel
              </button>
            )}
          </div>

          {/* People results overlay */}
          {isSearchMode && (
            <div className="px-4 pb-3">
              {searchingPeople ? (
                <div className="py-6 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-zinc-700 border-t-violet-400 rounded-full animate-spin" />
                </div>
              ) : searchQuery.length < 2 ? (
                <p className="text-xs text-zinc-600 py-4 text-center">Type at least 2 characters to search</p>
              ) : peopleResults.length === 0 ? (
                <p className="text-xs text-zinc-600 py-4 text-center">No people found for "{searchQuery}"</p>
              ) : (
                <div className="space-y-2 max-h-[55vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  {peopleResults.map(person => (
                    <div key={person.id} className="flex items-center gap-3 py-2">
                      {person.profile_picture ? (
                        <img src={person.profile_picture.replace(/^https?:\/\/[^/]+/, '')} alt={person.username}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{person.username[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white truncate">{person.full_name || person.username}</span>
                          {person.is_verified && <span className="text-violet-400 text-xs">✓</span>}
                          {person.is_teacher && <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded font-bold">Teacher</span>}
                        </div>
                        <p className="text-xs text-zinc-500">@{person.username}</p>
                        {person.bio && <p className="text-xs text-zinc-500 truncate mt-0.5">{person.bio}</p>}
                      </div>
                      <button
                        onClick={() => handleToggleFollow(person.id)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          person.is_following
                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            : 'bg-violet-600 hover:bg-violet-500 text-white'
                        }`}
                      >
                        {person.is_following ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

          {(subjectFilter || topicFilter) && (
            <div className="flex items-center justify-center pb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/15 rounded-full border border-violet-500/30">
                <span className="text-zinc-400 text-xs">Filtered:</span>
                <span className="text-violet-400 text-xs font-semibold">{topicFilter || subjectFilter}</span>
                <a href="/explore" className="text-zinc-500 hover:text-zinc-300 text-xs ml-1 transition-colors">✕</a>
              </div>
            </div>
          )}

          {/* Tab switcher */}
          <div className="px-4 pb-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex gap-1">
              <button
                onClick={() => { setFeedMode('personalized'); setCurrentIndex(0); setShowAnswer(false); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  feedMode === 'personalized'
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                For You
              </button>
              <button
                onClick={() => { setFeedMode('trending'); setCurrentIndex(0); setShowAnswer(false); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  feedMode === 'trending'
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Trending
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card Display */}
      <div className="relative h-full w-full flex items-center justify-center p-4 pt-[140px]">
        <div
          className="relative w-full max-w-md h-full cursor-pointer"
          style={{ maxHeight: 'calc(85vh - 120px)' }}
          onClick={() => setShowAnswer(!showAnswer)}
        >
          {/* Card Container */}
          <div className="rounded-xl border border-zinc-800 bg-[#1e1e22] h-full flex flex-col p-6 overflow-y-auto">
            {/* Subject / Topic badge row */}
            <div className="flex items-center justify-between mb-5 flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {currentCard.subject && (
                  <span className="bg-zinc-800 text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {currentCard.subject}
                  </span>
                )}
                {currentCard.topic && (
                  <span className="bg-zinc-800 text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {currentCard.topic}
                  </span>
                )}
              </div>
              <span className="bg-zinc-800 text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">Card</span>
            </div>

            {/* Question / Answer Display */}
            <div className="flex-1 flex items-center justify-center">
              {!showAnswer ? (
                <div className="text-center space-y-5 animate-fadeIn w-full">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                    <svg className="w-7 h-7 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-white font-bold text-[15px] leading-snug px-2">
                    {currentCard.question}
                  </h2>
                  <div className="flex items-center justify-center gap-2 animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    <span className="text-xs font-semibold text-zinc-400">Tap to reveal answer</span>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4 animate-fadeIn">
                  {/* Answer Card */}
                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Answer</p>
                    </div>
                    <p className="text-zinc-300 font-medium text-[14px] leading-relaxed">
                      {currentCard.answer}
                    </p>
                  </div>

                  {/* Explanation */}
                  {currentCard.explanation && (
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Explanation</p>
                      </div>
                      <p className="text-zinc-300 font-medium text-[14px] leading-relaxed">
                        {currentCard.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            {currentCard.tags && currentCard.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 flex-shrink-0">
                {currentCard.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-zinc-800 text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Creator Info */}
            {currentCard.created_by && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800/60 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  {currentCard.created_by.profile_picture ? (
                    <img
                      src={currentCard.created_by.profile_picture}
                      alt={currentCard.created_by.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-xs">
                      {currentCard.created_by.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-400 text-xs truncate">@{currentCard.created_by.username}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleFollow(currentCard.created_by?.id); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors flex-shrink-0 ${
                    currentCard.created_by?.id && followingCreators.has(currentCard.created_by.id)
                      ? 'bg-zinc-700 text-zinc-300'
                      : 'bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25'
                  }`}
                >
                  {currentCard.created_by?.id && followingCreators.has(currentCard.created_by.id) ? 'Following' : 'Follow'}
                </button>
              </div>
            )}

            {/* Like / Save counts row */}
            <div className="flex items-center gap-4 mt-3 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); handleLike(currentCard.id); }}
                className={`flex items-center gap-1.5 text-zinc-500 hover:text-violet-400 transition-colors ${isLiked ? 'text-violet-400' : ''}`}
              >
                <svg
                  className="w-4 h-4"
                  fill={isLiked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-zinc-500 text-xs font-medium">{currentCard.likes}</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleSave(currentCard.id); }}
                className={`flex items-center gap-1.5 text-zinc-500 hover:text-violet-400 transition-colors ${isSaved ? 'text-violet-400' : ''}`}
              >
                <svg
                  className="w-4 h-4"
                  fill={isSaved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="text-zinc-500 text-xs font-medium">{currentCard.saves}</span>
              </button>

              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const shareUrl = `${window.location.origin}/cards/${currentCard.id}`;
                  if (navigator.share) {
                    try { await navigator.share({ title: currentCard.question, url: shareUrl }); } catch {}
                  } else {
                    await navigator.clipboard.writeText(shareUrl).catch(() => {});
                  }
                }}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-violet-400 transition-colors ml-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-[148px] right-4 z-40">
        <div className="text-xs font-semibold bg-zinc-900/80 backdrop-blur-xl px-3 py-1.5 rounded-full border border-zinc-800">
          <span className="text-violet-400">{currentIndex + 1}</span>
          <span className="text-zinc-600"> / </span>
          <span className="text-zinc-400">{cards.length}</span>
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-3 z-40">
        {currentIndex > 0 && (
          <button
            onClick={() => { setCurrentIndex(currentIndex - 1); setShowAnswer(false); }}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-violet-400 hover:border-violet-500/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
        {currentIndex < cards.length - 1 && (
          <button
            onClick={() => { setCurrentIndex(currentIndex + 1); setShowAnswer(false); }}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-violet-400 hover:border-violet-500/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Swipe Hint - First Time */}
      {currentIndex === 0 && cards.length > 1 && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce z-30 pointer-events-none">
          <span className="text-zinc-500 text-xs font-semibold">Swipe up for next</span>
          <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      )}
    </div>
  );
}
