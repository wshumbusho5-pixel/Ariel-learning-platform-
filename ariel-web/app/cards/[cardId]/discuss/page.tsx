'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

interface Comment {
  id: string;
  user_id: string;
  username: string;
  profile_picture?: string;
  content: string;
  likes: number;
  created_at: string;
  replies?: Comment[];
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

export default function CardDiscussPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.cardId as string;

  const [card, setCard] = useState<Card | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    loadCardAndComments();
  }, [cardId]);

  const loadCardAndComments = async () => {
    setLoading(true);
    try {
      const [cardRes, commentsRes] = await Promise.all([
        api.get(`/api/cards/${cardId}`).catch(() => null),
        api.get(`/api/cards/${cardId}/comments`).catch(() => null),
      ]);
      if (cardRes) setCard(cardRes.data);
      if (commentsRes) setComments(commentsRes.data);
    } catch (error) {
      console.error('Failed to load card discussion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/api/cards/${cardId}/comments`, { content: newComment });
      setNewComment('');
      loadCardAndComments();
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await api.post(`/api/comments/${commentId}/like`);
      loadCardAndComments();
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-gray-50 lg:pl-56">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Discussion</h1>
                <p className="text-sm text-gray-600">{card?.subject || 'Study Card'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#0F4C75]"></div>
            </div>
          ) : (
            <>
              {/* Card Info */}
              {card && (
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {card.subject && (
                        <span className="px-3 py-1 bg-blue-600/10 text-blue-600 text-sm font-semibold rounded-full">
                          {card.subject}
                        </span>
                      )}
                      {card.topic && (
                        <span className="text-sm text-gray-600">• {card.topic}</span>
                      )}
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Question</h3>
                    <p className="text-xl font-bold text-gray-900">{card.question}</p>
                  </div>

                  {/* Answer - Click to reveal */}
                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="w-full text-left"
                  >
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-700">Answer</h3>
                        <span className="text-xs text-gray-500">
                          {showAnswer ? 'Hide' : 'Click to reveal'}
                        </span>
                      </div>
                      {showAnswer && (
                        <div className="space-y-3">
                          <p className="text-gray-900 font-medium">{card.answer}</p>
                          {card.explanation && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm font-semibold text-gray-700 mb-1">Explanation</p>
                              <p className="text-sm text-gray-700">{card.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Tags */}
                  {card.tags && card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {card.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ask a question or share your thoughts..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  rows={4}
                />
                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>

              {/* Comments */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Discussion ({comments.length})
                </h3>

                {comments.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">No comments yet. Start the discussion!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">
                            {comment.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{comment.username}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-3">{comment.content}</p>
                          <div className="flex items-center gap-6">
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span className="text-sm">{comment.likes || 0}</span>
                            </button>
                            <button className="text-sm text-gray-600 hover:text-blue-600 transition">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </>
  );
}
