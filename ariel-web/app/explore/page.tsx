'use client';

import { useState, useEffect, useRef } from 'react';
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
  const letter = (creator?.full_name || creator?.username || '?')[0].toUpperCase();
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

export default function ExplorePage() {
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
  const [peopleResults, setPeopleResults] = useState<UserResult[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const searchRef = useRef<HTMLInputElement>(null);

  const isSearchMode = searchFocused || searchQuery.length > 0;

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

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) { setPeopleResults([]); return; }
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
      if (user.is_following) await socialAPI.unfollowUser(userId);
      else await socialAPI.followUser(userId);
      setPeopleResults(prev => prev.map(u => u.id === userId ? { ...u, is_following: !u.is_following } : u));
    } catch {}
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
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">
          {!isSearchMode && (
            <div className="flex gap-1 bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10">
              <button
                onClick={() => { setFeedMode('personalized'); }}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  feedMode === 'personalized' ? 'bg-white text-black' : 'text-white/60'
                }`}
              >
                For You
              </button>
              <button
                onClick={() => { setFeedMode('trending'); }}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  feedMode === 'trending' ? 'bg-white text-black' : 'text-white/60'
                }`}
              >
                Trending
              </button>
            </div>
          )}

          {/* Search */}
          <div
            className={`flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 h-10 transition-all ${isSearchMode ? 'flex-1' : 'w-10 cursor-pointer ml-auto'}`}
            onClick={() => { if (!isSearchMode) { setSearchFocused(true); searchRef.current?.focus(); } }}
          >
            <svg className="w-4 h-4 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
              />
            )}
          </div>
          {isSearchMode && (
            <button onClick={() => { setSearchQuery(''); setSearchFocused(false); setPeopleResults([]); }}
              className="text-white/60 text-sm font-semibold flex-shrink-0">
              Cancel
            </button>
          )}
        </div>

        {/* Search results */}
        {isSearchMode && (
          <div className="mx-4 mt-1 bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden max-h-[60vh] overflow-y-auto">
            {searchingPeople ? (
              <div className="py-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-zinc-700 border-t-violet-400 rounded-full animate-spin" />
              </div>
            ) : searchQuery.length < 2 ? (
              <p className="text-xs text-zinc-600 py-6 text-center">Type to search people</p>
            ) : peopleResults.length === 0 ? (
              <p className="text-xs text-zinc-600 py-6 text-center">No results for "{searchQuery}"</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {peopleResults.map(person => (
                  <div key={person.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar creator={person} size={40} />
                    <div className="flex-1 min-w-0" onClick={() => router.push(`/profile/${person.username}`)}>
                      <p className="text-sm font-bold text-white truncate">{person.full_name || person.username}</p>
                      <p className="text-xs text-zinc-500">@{person.username}</p>
                    </div>
                    <button
                      onClick={() => handleToggleFollow(person.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        person.is_following ? 'bg-zinc-800 text-zinc-400' : 'bg-violet-600 text-white'
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

      {/* TikTok scroll container */}
      {!isSearchMode && (
        cards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white mb-2">No cards yet</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">Try Trending or follow more people to see cards here.</p>
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
            {cards.map((card, idx) => {
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
                    className="absolute inset-0 flex flex-col justify-center px-5 pb-28 pt-24 cursor-pointer"
                    onClick={() => handleFlip(card.id)}
                  >
                    {/* Subject / Topic pills */}
                    <div className="flex items-center gap-2 flex-wrap mb-5">
                      {card.subject && (
                        <span className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[11px] font-bold uppercase tracking-wide">
                          {card.subject}
                        </span>
                      )}
                      {card.topic && (
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[11px] font-medium">
                          {card.topic}
                        </span>
                      )}
                    </div>

                    {/* Card content */}
                    <div className="flex-1 flex flex-col justify-center">
                      {!isFlipped ? (
                        <div className="space-y-6">
                          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Question</p>
                          <h2 className="text-white text-2xl font-black leading-snug">
                            {card.question}
                          </h2>
                          <div className="flex items-center gap-2 mt-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            <span className="text-zinc-500 text-sm">Tap to reveal answer</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Answer</p>
                          <p className="text-white text-xl font-bold leading-relaxed">
                            {card.answer}
                          </p>
                          {card.explanation && (
                            <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Explanation</p>
                              <p className="text-zinc-300 text-sm leading-relaxed">{card.explanation}</p>
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleFlip(card.id); }}
                            className="mt-2 text-sm text-zinc-600 hover:text-zinc-400"
                          >
                            Tap to see question again
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Creator info — bottom left */}
                  <div className="absolute bottom-28 left-5 right-20 z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (card.created_by?.username) router.push(`/profile/${card.created_by.username}`); }}
                      className="flex items-center gap-3"
                    >
                      <Avatar creator={card.created_by} size={42} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold text-sm">
                            {card.created_by?.full_name || card.created_by?.username || 'Ariel'}
                          </span>
                          {card.created_by?.is_verified && (
                            <svg className="w-3.5 h-3.5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-zinc-400 text-xs">@{card.created_by?.username || 'ariel'}</p>
                      </div>
                    </button>
                    {card.created_by?.id && (
                      <button
                        onClick={(e) => handleFollow(e, card.created_by?.id)}
                        className={`mt-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          isFollowing
                            ? 'bg-transparent border-white/30 text-white/60'
                            : 'bg-white text-black border-transparent'
                        }`}
                      >
                        {isFollowing ? 'Following' : '+ Follow'}
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
        )
      )}
    </div>
  );
}
