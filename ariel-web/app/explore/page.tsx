'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { cardsAPI, socialAPI } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface Creator {
  id?: string;
  username: string;
  full_name?: string;
  profile_picture?: string;
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
  visibility: string;
  created_by?: Creator;
}

interface UserResult {
  id: string;
  username: string;
  full_name?: string;
  profile_picture?: string;
  bio?: string;
  is_following: boolean;
  is_verified?: boolean;
}

function Avatar({ creator, size = 40 }: { creator?: Creator; size?: number }) {
  const letter = (creator?.username || creator?.full_name || '?')[0].toUpperCase();
  if (creator?.profile_picture) {
    return (
      <img
        src={creator.profile_picture.replace(/^https?:\/\/[^/]+(?=\/)/, '')}
        alt={creator.username}
        className="rounded-full object-cover border-2 border-white/20"
        style={{ width: size, height: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center border-2 border-white/20 flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-white font-bold" style={{ fontSize: size * 0.35 }}>{letter}</span>
    </div>
  );
}

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectFilter = searchParams.get('subject');
  const topicFilter = searchParams.get('topic');
  const { checkAuth } = useAuth();

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState<'personalized' | 'trending'>('personalized');
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Card[]>([]);   // loaded into scroll
  const [suggestions, setSuggestions] = useState<Card[]>([]);       // dropdown preview
  const [searching, setSearching] = useState(false);
  const [activeSearch, setActiveSearch] = useState('');             // committed search term
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const searchRef = useRef<HTMLInputElement>(null);

  const showDropdown = searchFocused && searchQuery.length >= 2;
  const isSearchActive = activeSearch.length > 0;                   // results in scroll

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { loadCards(); }, [feedMode, subjectFilter, topicFilter]);

  const loadCards = async () => {
    setLoading(true);
    setFlipped(new Set());
    try {
      const data = feedMode === 'personalized'
        ? await cardsAPI.getPersonalizedFeed(100)
        : await cardsAPI.getTrendingCards(100);

      let result = data as Card[];

      const filter = topicFilter || subjectFilter;
      if (filter) {
        const kw = filter.toLowerCase();
        const filtered = result.filter(c =>
          (c.subject || '').toLowerCase().includes(kw) ||
          (c.topic || '').toLowerCase().includes(kw) ||
          (c.tags || []).some(t => t.toLowerCase().includes(kw))
        );
        result = filtered.length > 0 ? filtered : result;
      }

      setCards(result);
      const lc: Record<string, number> = {};
      const sc: Record<string, number> = {};
      result.forEach(c => { lc[c.id] = c.likes; sc[c.id] = c.saves; });
      setLikeCounts(lc);
      setSaveCounts(sc);
    } catch {
      try {
        const fallback = await cardsAPI.getTrendingCards(50) as Card[];
        setCards(fallback);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    const isLiked = liked.has(cardId);
    const next = new Set(liked);
    isLiked ? next.delete(cardId) : next.add(cardId);
    setLiked(next);
    setLikeCounts(prev => ({ ...prev, [cardId]: (prev[cardId] || 0) + (isLiked ? -1 : 1) }));
    try { await cardsAPI.likeCard(cardId); } catch {
      const rev = new Set(liked); setLiked(rev);
      setLikeCounts(prev => ({ ...prev, [cardId]: (prev[cardId] || 0) + (isLiked ? 1 : -1) }));
    }
  };

  const handleSave = async (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    const isSaved = saved.has(cardId);
    const next = new Set(saved);
    isSaved ? next.delete(cardId) : next.add(cardId);
    setSaved(next);
    setSaveCounts(prev => ({ ...prev, [cardId]: (prev[cardId] || 0) + (isSaved ? -1 : 1) }));
    try { await cardsAPI.saveCardToDeck(cardId); } catch {
      const rev = new Set(saved); setSaved(rev);
      setSaveCounts(prev => ({ ...prev, [cardId]: (prev[cardId] || 0) + (isSaved ? 1 : -1) }));
    }
  };

  const handleFollow = async (e: React.MouseEvent, userId?: string) => {
    e.stopPropagation();
    if (!userId) return;
    const isFollowing = following.has(userId);
    const next = new Set(following);
    isFollowing ? next.delete(userId) : next.add(userId);
    setFollowing(next);
    try {
      if (isFollowing) await socialAPI.unfollowUser(userId);
      else await socialAPI.followUser(userId);
    } catch {
      const rev = new Set(following); setFollowing(rev);
    }
  };

  const handleFlip = (cardId: string) => {
    const next = new Set(flipped);
    flipped.has(cardId) ? next.delete(cardId) : next.add(cardId);
    setFlipped(next);
  };

  // While typing — fetch suggestions for dropdown only
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) { setSuggestions([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await cardsAPI.search(q.trim(), 8) as Card[];
        setSuggestions(results);
      } catch {}
      finally { setSearching(false); }
    }, 300);
  };

  // Commit search — loads results INTO the scroll
  const commitSearch = async (q: string) => {
    if (!q.trim()) return;
    setSearchFocused(false);
    setActiveSearch(q.trim());
    setSearching(true);
    try {
      const results = await cardsAPI.search(q.trim(), 50) as Card[];
      setSearchResults(results);
      const lc: Record<string, number> = {};
      const sc: Record<string, number> = {};
      results.forEach(c => { lc[c.id] = c.likes; sc[c.id] = c.saves; });
      setLikeCounts(prev => ({ ...prev, ...lc }));
      setSaveCounts(prev => ({ ...prev, ...sc }));
    } catch {}
    finally { setSearching(false); }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setSearchResults([]);
    setSuggestions([]);
    setSearchFocused(false);
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center lg:pl-[72px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-violet-400 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading cards…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black overflow-hidden lg:pl-[72px]">
      {/* Fixed top bar */}
      <div className="absolute top-0 left-0 right-0 lg:left-[72px] z-50">
        {/* Glassy header bg */}
        <div
          className="px-4 pt-4 pb-3"
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Row 1: back + search bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7-7 7 7 7" />
              </svg>
            </button>

            {/* Glassy search pill */}
            <div
              className="flex items-center gap-2.5 flex-1 h-11 px-4 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) commitSearch(searchQuery); }}
                placeholder="Cards, subjects, topics…"
                className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-white/30"
                style={{ color: '#e7e9ea' }}
              />
              {(searchQuery.length > 0 || isSearchActive) && (
                <button
                  onClick={clearSearch}
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: active search label OR For You / Trending toggle */}
          {isSearchActive ? (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-[13px] font-semibold" style={{ color: '#8b9099' }}>
                {searching ? 'Searching…' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for`}
              </p>
              {!searching && <span className="text-[13px] font-bold text-violet-400">"{activeSearch}"</span>}
            </div>
          ) : (
            <div className="flex gap-1 mt-3 p-1 rounded-full w-fit" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setFeedMode('personalized')}
                className="px-4 py-1.5 rounded-full text-[13px] font-bold transition-all"
                style={feedMode === 'personalized'
                  ? { background: 'rgba(255,255,255,0.92)', color: '#000' }
                  : { color: 'rgba(255,255,255,0.45)' }}
              >
                For You
              </button>
              <button
                onClick={() => setFeedMode('trending')}
                className="px-4 py-1.5 rounded-full text-[13px] font-bold transition-all"
                style={feedMode === 'trending'
                  ? { background: 'rgba(255,255,255,0.92)', color: '#000' }
                  : { color: 'rgba(255,255,255,0.45)' }}
              >
                Trending
              </button>
            </div>
          )}
        </div>

        {/* Suggestions dropdown — while typing, before committing */}
        {showDropdown && (
          <div
            className="mx-4 mt-2 rounded-2xl overflow-hidden max-h-[55vh] overflow-y-auto"
            style={{
              background: 'rgba(10,10,12,0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
            }}
          >
            {searching ? (
              <div className="py-6 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-400 rounded-full animate-spin" />
                <span className="text-[13px]" style={{ color: '#8b9099' }}>Looking…</span>
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-[13px] py-6 text-center" style={{ color: '#8b9099' }}>No matches for "{searchQuery}"</p>
            ) : (
              <div>
                {/* "See all" row */}
                <button
                  onMouseDown={() => commitSearch(searchQuery)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-[14px] font-semibold" style={{ color: '#e7e9ea' }}>
                    See all results for <span className="text-violet-400">"{searchQuery}"</span>
                  </span>
                </button>

                {/* Keyword/topic suggestions from results */}
                {(() => {
                  const subjects = [...new Set(suggestions.map(c => c.subject).filter(Boolean))] as string[];
                  const topics = [...new Set(suggestions.map(c => c.topic).filter(Boolean))] as string[];
                  const chips = [...subjects.map(s => ({ label: s, kind: 'subject' })), ...topics.slice(0, 4).map(t => ({ label: t, kind: 'topic' }))];
                  if (!chips.length) return null;
                  return (
                    <div className="px-4 py-2 flex flex-wrap gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {chips.map(chip => (
                        <button
                          key={chip.label}
                          onMouseDown={() => commitSearch(chip.label!)}
                          className="px-3 py-1 rounded-full text-[12px] font-bold transition-all"
                          style={chip.kind === 'subject'
                            ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }
                            : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8b9099' }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* Card previews */}
                {suggestions.slice(0, 5).map((card, i) => (
                  <button
                    key={card.id}
                    onMouseDown={() => commitSearch(card.question)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  >
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#8b9099' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] leading-snug line-clamp-1" style={{ color: '#e7e9ea' }}>{card.question}</p>
                      {(card.subject || card.topic) && (
                        <p className="text-[11px] mt-0.5 text-violet-400">{[card.subject, card.topic].filter(Boolean).join(' · ')}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TikTok scroll container */}
      {(() => {
        const displayCards = isSearchActive ? searchResults : cards;
        return displayCards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white mb-2">{isSearchActive ? `No results for "${activeSearch}"` : 'No cards yet'}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{isSearchActive ? 'Try a different keyword or subject.' : 'Try Trending or follow more people to see cards here.'}</p>
          </div>
        ) : (
          <div
            className="h-full overflow-y-scroll"
            style={{
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            {displayCards.map((card, idx) => {
              const isFlipped = flipped.has(card.id);
              const isLiked = liked.has(card.id);
              const isSaved = saved.has(card.id);
              const isFollowing = following.has(card.created_by?.id || '');
              const lc = likeCounts[card.id] ?? card.likes;
              const sc = saveCounts[card.id] ?? card.saves;

              return (
                <div
                  key={card.id}
                  className="relative w-full flex-shrink-0"
                  style={{ height: '100svh', scrollSnapAlign: 'start' }}
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950" />

                  {/* Tap to flip */}
                  <div
                    className="absolute inset-0 flex flex-col justify-center px-6 cursor-pointer"
                    style={{ paddingTop: '144px', paddingBottom: '148px' }}
                    onClick={() => handleFlip(card.id)}
                  >
                    {!isFlipped ? (
                      <div className="space-y-5">
                        {/* Subject inline above question — no pills */}
                        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>
                          {[card.subject, card.topic].filter(Boolean).join(' · ') || 'Question'}
                        </p>

                        {/* Question — size scales to length */}
                        <h2
                          className={`text-white font-semibold leading-snug ${
                            card.question.length > 120 ? 'text-[22px]' :
                            card.question.length > 70  ? 'text-[28px]' :
                                                         'text-[36px]'
                          }`}
                          style={{ fontFamily: "var(--font-caveat), cursive" }}
                        >
                          {card.question}
                        </h2>

                        {/* Tap hint */}
                        <div className="flex items-center gap-2 pt-1">
                          <div className="w-1 h-1 rounded-full bg-white/20 animate-pulse" />
                          <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>tap to reveal</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Answer</p>
                        <p
                          className={`text-white font-semibold leading-snug ${
                            card.answer.length > 120 ? 'text-[22px]' :
                            card.answer.length > 70  ? 'text-[28px]' :
                                                       'text-[36px]'
                          }`}
                          style={{ fontFamily: "var(--font-caveat), cursive" }}
                        >
                          {card.answer}
                        </p>
                        {card.explanation && (
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Why</p>
                            <p className="text-zinc-300 text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-caveat), cursive" }}>{card.explanation}</p>
                          </div>
                        )}
                        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>tap to see question</p>
                      </div>
                    )}
                  </div>

                  {/* Creator info — bottom left, single line */}
                  <div className="absolute bottom-28 left-5 right-20 z-10 flex items-center gap-2.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (card.created_by?.username) router.push(`/profile/${card.created_by.username}`); }}
                      className="flex items-center gap-2 min-w-0 flex-1"
                    >
                      <Avatar creator={card.created_by} size={32} />
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-white font-semibold text-sm truncate">
                          {card.created_by?.username || card.created_by?.full_name || 'Ariel'}
                        </span>
                        {card.created_by?.is_verified && (
                          <svg className="w-3 h-3 text-violet-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                    {card.created_by?.id && (
                      <button
                        onClick={(e) => handleFollow(e, card.created_by?.id)}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                          isFollowing
                            ? 'border-white/20 text-white/40'
                            : 'border-white/40 text-white hover:bg-white hover:text-black'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>

                  {/* Action buttons — right side (TikTok style) */}
                  <div className="absolute bottom-28 right-4 flex flex-col items-center gap-6 z-10">
                    {/* Like */}
                    <button onClick={(e) => handleLike(e, card.id)} className="flex flex-col items-center gap-1">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isLiked ? 'bg-red-500/20' : 'bg-white/10'}`}>
                        <svg className={`w-6 h-6 transition-colors ${isLiked ? 'text-red-400' : 'text-white'}`}
                          fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span className="text-white text-[11px] font-semibold">{lc}</span>
                    </button>

                    {/* Save */}
                    <button onClick={(e) => handleSave(e, card.id)} className="flex flex-col items-center gap-1">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isSaved ? 'bg-violet-500/20' : 'bg-white/10'}`}>
                        <svg className={`w-6 h-6 transition-colors ${isSaved ? 'text-violet-400' : 'text-white'}`}
                          fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      <span className="text-white text-[11px] font-semibold">{sc}</span>
                    </button>

                    {/* Share */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}/cards/${card.id}`;
                        try { if (navigator.share) await navigator.share({ title: card.question, url }); else await navigator.clipboard.writeText(url); } catch {}
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </div>
                      <span className="text-white text-[11px] font-semibold">Share</span>
                    </button>
                  </div>

                  {/* Progress dot */}
                  <div className="absolute top-16 right-4 z-10">
                    <span className="text-[11px] text-white/40 font-medium">{idx + 1}/{cards.length}</span>
                  </div>

                  {/* Swipe hint on first card */}
                  {idx === 0 && cards.length > 1 && (
                    <div className="absolute bottom-36 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce pointer-events-none z-10">
                      <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className="text-white/30 text-xs">Scroll for next</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ExploreContent />
    </Suspense>
  );
}
