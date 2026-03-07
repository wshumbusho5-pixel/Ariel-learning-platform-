'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { cardsAPI, aiChatAPI } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';

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
  created_at?: string;
}

const EDUCATION_LABELS: Record<string, string> = {
  'high-school': 'High School',
  university: 'University',
  professional: 'Professional',
  'self-study': 'Self Study',
};

function TopicPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const topic = decodeURIComponent(params.topic as string);
  const subject = searchParams.get('subject') || '';

  const [cards, setCards] = useState<Card[]>([]);
  const [preTuit, setPreTuit] = useState('');
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingPreTuit, setLoadingPreTuit] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCards();
    generatePreTuit();
  }, [topic]);

  const loadCards = async () => {
    setLoadingCards(true);
    try {
      const data = await cardsAPI.getTrendingCards(100);
      const keyword = topic.toLowerCase();
      const filtered = (data as Card[]).filter((c) => {
        const hay = `${c.topic ?? ''} ${c.subject ?? ''} ${(c.tags ?? []).join(' ')}`.toLowerCase();
        return hay.includes(keyword);
      });
      setCards(filtered.length > 0 ? filtered : (data as Card[]).slice(0, 10));
    } catch {
      setCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  const generatePreTuit = async () => {
    setLoadingPreTuit(true);
    const level = user?.education_level ? (EDUCATION_LABELS[user.education_level] ?? user.education_level) : 'university';
    const prompt = `You are a friendly study tutor. Write 2-3 sentences introducing "${topic}"${subject ? ` (part of ${subject})` : ''} for a ${level} student. Be specific about what they will learn and why it matters. Be warm and direct. Return only plain text, no JSON, no markdown.`;
    try {
      const res = await aiChatAPI.complete(prompt);
      let text = typeof res?.reply === 'string' ? res.reply : '';
      try {
        const p = JSON.parse(text);
        text = p.answer ?? p.text ?? p.reply ?? text;
      } catch {}
      setPreTuit(text.trim());
    } catch {
      setPreTuit(
        `${topic} is a key area of study${subject ? ` within ${subject}` : ''}. Explore the community cards below to start building your understanding, and create your own cards to lock in what you learn.`
      );
    } finally {
      setLoadingPreTuit(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleLike = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await cardsAPI.likeCard(cardId);
      setLikedCards((prev) => {
        const next = new Set(prev);
        const wasLiked = next.has(cardId);
        wasLiked ? next.delete(cardId) : next.add(cardId);
        setCards((cs) =>
          cs.map((c) =>
            c.id === cardId ? { ...c, likes: wasLiked ? Math.max(0, c.likes - 1) : c.likes + 1 } : c
          )
        );
        return next;
      });
    } catch {}
  };

  const handleSave = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await cardsAPI.saveCardToDeck(cardId);
      setSavedCards((prev) => {
        const next = new Set(prev);
        next.has(cardId) ? next.delete(cardId) : next.add(cardId);
        return next;
      });
    } catch {}
  };

  const createUrl = `/create-cards?topic=${encodeURIComponent(topic)}${subject ? `&subject=${encodeURIComponent(subject)}` : ''}`;

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-black lg:pl-[72px] pb-24">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-black/95 backdrop-blur border-b border-zinc-800">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-white truncate">{topic}</h1>
              {subject && <p className="text-xs text-zinc-500">{subject}</p>}
            </div>
            <button
              onClick={() => router.push(createUrl)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-full transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

          {/* Ariel pre-tuit intro */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-[10px]">A</span>
              </div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Ariel's intro
                {user?.education_level && (
                  <span className="ml-1 text-zinc-700">· {EDUCATION_LABELS[user.education_level] ?? user.education_level}</span>
                )}
              </p>
            </div>
            {loadingPreTuit ? (
              <div className="space-y-2">
                <div className="h-3 bg-zinc-800 rounded-full animate-pulse w-full" />
                <div className="h-3 bg-zinc-800 rounded-full animate-pulse w-4/5" />
                <div className="h-3 bg-zinc-800 rounded-full animate-pulse w-2/3" />
              </div>
            ) : (
              <p className="text-sm text-zinc-300 leading-relaxed">{preTuit}</p>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push(createUrl)}
              className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 hover:border-sky-500/50 hover:bg-sky-500/5 rounded-2xl transition-all text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Create a card</p>
                <p className="text-xs text-zinc-500">Add your own</p>
              </div>
            </button>
            <button
              onClick={() => router.push(`/cram?topic=${encodeURIComponent(topic)}`)}
              className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 hover:border-sky-500/50 hover:bg-sky-500/5 rounded-2xl transition-all text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Cram mode</p>
                <p className="text-xs text-zinc-500">AI-generated cards</p>
              </div>
            </button>
          </div>

          {/* Community cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Community cards</h2>
              {!loadingCards && (
                <span className="text-xs text-zinc-500">{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {loadingCards ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-pulse">
                    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <p className="text-zinc-500 text-sm mb-4">No community cards yet for "{topic}".</p>
                <button
                  onClick={() => router.push(createUrl)}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Be the first to create one
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cards.map((card) => {
                  const isExpanded = expandedCards.has(card.id);
                  const isLiked = likedCards.has(card.id);
                  const isSaved = savedCards.has(card.id);
                  return (
                    <div key={card.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                      {/* Card content — tap to flip */}
                      <div
                        className="p-5 cursor-pointer"
                        onClick={() => toggleExpanded(card.id)}
                      >
                        {!isExpanded ? (
                          <div>
                            <p className="text-white text-sm font-medium leading-snug">{card.question}</p>
                            <p className="text-zinc-600 text-xs mt-2 flex items-center gap-1.5">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Tap to reveal answer
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-zinc-400 text-xs leading-snug">{card.question}</p>
                            <div className="h-px bg-zinc-800" />
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <p className="text-white text-sm font-medium leading-relaxed">{card.answer}</p>
                            </div>
                            {card.explanation && (
                              <div className="pt-2 border-t border-zinc-800">
                                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1">Explanation</p>
                                <p className="text-zinc-400 text-xs leading-relaxed">{card.explanation}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action bar */}
                      <div className="px-5 pb-3 flex items-center gap-4 border-t border-zinc-800/60">
                        <button
                          onClick={(e) => handleLike(card.id, e)}
                          className="flex items-center gap-1.5 pt-2.5 group"
                        >
                          <svg
                            className={`w-4 h-4 transition-colors ${isLiked ? 'text-red-500' : 'text-zinc-600 group-hover:text-white'}`}
                            fill={isLiked ? 'currentColor' : 'none'}
                            stroke={isLiked ? 'none' : 'currentColor'}
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {card.likes > 0 && <span className="text-xs text-zinc-600">{card.likes}</span>}
                        </button>

                        <button
                          onClick={(e) => handleSave(card.id, e)}
                          className="flex items-center gap-1.5 pt-2.5 group ml-auto"
                        >
                          <svg
                            className={`w-4 h-4 transition-colors ${isSaved ? 'text-sky-400' : 'text-zinc-600 group-hover:text-white'}`}
                            fill={isSaved ? 'currentColor' : 'none'}
                            stroke={isSaved ? 'none' : 'currentColor'}
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          <span className={`text-xs ${isSaved ? 'text-sky-400' : 'text-zinc-600'}`}>
                            {isSaved ? 'Saved' : 'Save'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

export default function TopicPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-sky-500 rounded-full animate-spin" />
      </div>
    }>
      <TopicPageInner />
    </Suspense>
  );
}
