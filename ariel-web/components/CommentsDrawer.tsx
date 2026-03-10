'use client';

import { useState, useEffect, useRef } from 'react';
import { useComments } from '@/lib/commentsContext';
import { useAuth } from '@/lib/useAuth';
import api from '@/lib/api';

interface Comment {
  id: string;
  user_id: string;
  username: string;
  profile_picture?: string;
  text: string;
  likes: number;
  liked_by_current_user?: boolean;
  created_at: string;
  replies?: Comment[];
}

interface Card {
  id: string;
  question: string;
  subject?: string;
  topic?: string;
}

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function CommentsDrawer() {
  const { cardId, closeComments } = useComments();
  const { user } = useAuth();

  const [card, setCard] = useState<Card | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardId) {
      setCard(null);
      setComments([]);
      setInput('');
      setReplyingTo(null);
      return;
    }
    load(cardId);
  }, [cardId]);

  // Lock body scroll when open
  useEffect(() => {
    if (cardId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [cardId]);

  const load = async (id: string) => {
    setLoading(true);
    try {
      const [cardRes, commentsRes] = await Promise.all([
        api.get(`/api/cards/${id}`).catch(() => null),
        api.get(`/api/cards/${id}/comments`).catch(() => null),
      ]);
      if (cardRes) setCard(cardRes.data);
      if (commentsRes) {
        const data: Comment[] = commentsRes.data ?? [];
        setComments(data);
        setLikedComments(new Set(data.filter((c) => c.liked_by_current_user).map((c) => c.id)));
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!input.trim() || !cardId || submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/api/cards/${cardId}/comments`, { text: input.trim() });
      setInput('');
      setReplyingTo(null);
      await load(cardId);
      // Scroll to bottom after posting
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch {}
    finally { setSubmitting(false); }
  };

  const handleLike = async (commentId: string) => {
    try {
      await api.post(`/api/cards/comments/${commentId}/like`);
      setLikedComments((prev) => {
        const next = new Set(prev);
        const wasLiked = next.has(commentId);
        wasLiked ? next.delete(commentId) : next.add(commentId);
        setComments((cs) =>
          cs.map((c) =>
            c.id === commentId
              ? { ...c, likes: wasLiked ? Math.max(0, c.likes - 1) : c.likes + 1 }
              : c
          )
        );
        return next;
      });
    } catch {}
  };

  const startReply = (comment: Comment) => {
    setReplyingTo({ id: comment.id, username: comment.username });
    setInput(`@${comment.username} `);
    inputRef.current?.focus();
  };

  if (!cardId) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeComments}
      />

      {/* Drawer */}
      <div
        className="relative w-full bg-black border-t border-zinc-800 rounded-t-3xl flex flex-col"
        style={{ maxHeight: '85dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex items-center justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 flex-shrink-0">
          <h3 className="text-sm font-bold text-white">
            Comments {comments.length > 0 && <span className="text-zinc-500 font-normal">({comments.length})</span>}
          </h3>
          <button
            onClick={closeComments}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Card context — mini preview */}
        {card && (
          <div className="px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              {card.subject && (
                <span className="text-xs font-semibold text-violet-300 bg-violet-300/10 px-2 py-0.5 rounded-full">
                  {card.subject}
                </span>
              )}
              {card.topic && (
                <span className="text-xs text-zinc-500">{card.topic}</span>
              )}
            </div>
            <p className="text-sm text-zinc-300 mt-1 line-clamp-2 leading-snug">{card.question}</p>
          </div>
        )}

        {/* Comments list */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-zinc-700 border-t-violet-300 rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">No comments yet.</p>
              <p className="text-xs text-zinc-700 mt-1">Be the first to start the discussion.</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isLiked = likedComments.has(comment.id);
              return (
                <div key={comment.id} className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-violet-300/15 border border-violet-300/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-300 text-xs font-bold">
                      {comment.username?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-white">{comment.username}</span>
                      <span className="text-xs text-zinc-600">{timeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-zinc-300 mt-0.5 leading-relaxed">{comment.text}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-1.5">
                      <button
                        onClick={() => startReply(comment)}
                        className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors font-medium"
                      >
                        Reply
                      </button>
                    </div>

                    {/* Nested replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 space-y-3 pl-2 border-l border-zinc-800">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                              <span className="text-zinc-400 text-[10px] font-bold">
                                {reply.username?.[0]?.toUpperCase() ?? '?'}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-white">{reply.username}</span>
                              <span className="text-[10px] text-zinc-600 ml-1.5">{timeAgo(reply.created_at)}</span>
                              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{reply.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Like */}
                  <button
                    onClick={() => handleLike(comment.id)}
                    className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-0.5"
                  >
                    <svg
                      className={`w-4 h-4 transition-colors ${isLiked ? 'text-red-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                      fill={isLiked ? 'currentColor' : 'none'}
                      stroke={isLiked ? 'none' : 'currentColor'}
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {(comment.likes > 0 || isLiked) && (
                      <span className="text-[10px] text-zinc-600">{comment.likes + (isLiked && !comment.liked_by_current_user ? 1 : 0)}</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Input bar — pinned at bottom */}
        <div className="flex-shrink-0 border-t border-zinc-800 px-4 py-3 pb-safe">
          {replyingTo && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-zinc-500">
                Replying to <span className="text-zinc-300 font-semibold">@{replyingTo.username}</span>
              </span>
              <button
                onClick={() => { setReplyingTo(null); setInput(''); }}
                className="text-xs text-zinc-600 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            {/* User avatar */}
            <div className="w-8 h-8 rounded-full bg-violet-300/15 border border-violet-300/30 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-300 text-xs font-bold">
                {user?.username?.[0]?.toUpperCase() ?? user?.full_name?.[0]?.toUpperCase() ?? 'Y'}
              </span>
            </div>

            <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              />
              {input.trim() && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="text-violet-300 hover:text-violet-300 font-semibold text-sm disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-violet-300/30 border-t-violet-300 rounded-full animate-spin" />
                  ) : 'Post'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
