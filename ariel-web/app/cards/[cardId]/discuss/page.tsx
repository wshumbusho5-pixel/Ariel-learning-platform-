'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { timeAgo } from '@/lib/time';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import { useAuth } from '@/lib/useAuth';

interface Comment {
  id: string;
  user_id: string;
  username: string;
  profile_picture?: string;
  text: string;
  likes: number;
  liked_by_current_user?: boolean;
  created_at: string;
}

interface Card {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  tags: string[];
}


function Avatar({ name, src }: { name?: string; src?: string }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return <img src={src.replace(/^https?:\/\/[^/]+/, '')} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" onError={() => setBroken(true)} />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function CardDiscussPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const cardId = params.cardId as string;
  const bottomRef = useRef<HTMLDivElement>(null);

  const [card, setCard] = useState<Card | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  useEffect(() => { load(); }, [cardId]);

  const load = async () => {
    setLoading(true);
    try {
      const [cardRes, commentsRes] = await Promise.all([
        api.get(`/api/cards/${cardId}`).catch(() => null),
        api.get(`/api/cards/${cardId}/comments`).catch(() => null),
      ]);
      if (cardRes) setCard(cardRes.data);
      if (commentsRes) {
        const data: Comment[] = commentsRes.data ?? [];
        setComments(data);
        setLikedComments(new Set(data.filter(c => c.liked_by_current_user).map(c => c.id)));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || submitting) return;
    const text = input.trim();
    setInput('');
    setSubmitting(true);

    // Optimistic add
    const optimistic: Comment = {
      id: `opt-${Date.now()}`,
      user_id: user?.id ?? '',
      username: user?.username ?? 'You',
      text,
      likes: 0,
      liked_by_current_user: false,
      created_at: new Date().toISOString(),
    };
    setComments(prev => [optimistic, ...prev]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      // API expects { text: "..." }
      await api.post(`/api/cards/${cardId}/comments`, { text });
      // Reload to get server-confirmed comment
      const res = await api.get(`/api/cards/${cardId}/comments`).catch(() => null);
      if (res) setComments(res.data ?? []);
    } catch {
      // Revert optimistic
      setComments(prev => prev.filter(c => c.id !== optimistic.id));
      setInput(text);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    const wasLiked = likedComments.has(commentId);
    // Optimistic
    setLikedComments(prev => {
      const next = new Set(prev);
      wasLiked ? next.delete(commentId) : next.add(commentId);
      return next;
    });
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, likes: wasLiked ? Math.max(0, c.likes - 1) : c.likes + 1 } : c
    ));
    try {
      await api.post(`/api/cards/comments/${commentId}/like`);
    } catch {
      // Revert
      setLikedComments(prev => {
        const next = new Set(prev);
        wasLiked ? next.add(commentId) : next.delete(commentId);
        return next;
      });
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, likes: wasLiked ? c.likes + 1 : Math.max(0, c.likes - 1) } : c
      ));
    }
  };

  return (
    <>
      <SideNav />
      <div className="fixed inset-0 lg:left-[72px] bg-white flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 h-14 border-b border-gray-100 bg-white z-10">
          <button onClick={() => router.push(`/cards/${cardId}`)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900">Discussion</p>
            {card?.subject && <p className="text-xs text-zinc-400">{card.subject}</p>}
          </div>
          <span className="text-xs font-semibold text-zinc-400">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="px-4 py-4 space-y-4 pb-[160px]">
              {/* Card preview */}
              {card && (
                <div
                  className="bg-zinc-900 rounded-2xl p-5 cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => setShowAnswer(v => !v)}
                >
                  {card.subject && (
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-violet-400 bg-violet-400/10 rounded-full mb-3">
                      {card.subject}
                    </span>
                  )}
                  <p className="text-white font-semibold leading-snug">{card.question}</p>
                  {!showAnswer && (
                    <p className="text-zinc-600 text-xs mt-3">Tap to reveal answer</p>
                  )}
                  {showAnswer && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-zinc-300 text-sm leading-relaxed">{card.answer}</p>
                      {card.explanation && (
                        <p className="text-zinc-500 text-xs mt-3 leading-relaxed">{card.explanation}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Comments */}
              {comments.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-violet-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-400">No comments yet — start the discussion</p>
                </div>
              ) : (
                comments.map(comment => {
                  const isLiked = likedComments.has(comment.id);
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar name={comment.username} src={comment.profile_picture} />
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-zinc-900">{comment.username}</span>
                            <span className="text-[10px] text-zinc-400">{timeAgo(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-zinc-700 leading-relaxed">{comment.text}</p>
                        </div>
                        <button
                          onClick={() => handleLike(comment.id)}
                          className={`flex items-center gap-1 mt-1 ml-2 text-xs font-semibold transition-colors ${isLiked ? 'text-red-500' : 'text-zinc-400 hover:text-red-400'}`}
                        >
                          <svg className="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {comment.likes > 0 && <span>{comment.likes}</span>}
                          <span>{isLiked ? 'Liked' : 'Like'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="flex-shrink-0 px-4 py-3 pb-[84px] lg:pb-4 border-t border-gray-100 bg-white">
          <div className="flex items-end gap-3">
            <Avatar name={user?.username ?? 'You'} src={user?.profile_picture} />
            <div className="flex-1 flex items-end gap-2 bg-gray-100 rounded-2xl px-4 py-2.5 min-h-[44px]">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Add to the discussion…"
                rows={1}
                className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-gray-400 focus:outline-none resize-none max-h-28 overflow-y-auto"
                style={{ lineHeight: '1.5' }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || submitting}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${input.trim() && !submitting ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-200'}`}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-violet-500 rounded-full animate-spin" />
                ) : (
                  <svg className={`w-3.5 h-3.5 ${input.trim() ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
