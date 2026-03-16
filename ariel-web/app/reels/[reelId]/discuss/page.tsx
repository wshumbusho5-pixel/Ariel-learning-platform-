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

interface Reel {
  id: string;
  title: string;
  description?: string;
  creator_username: string;
  video_url?: string;
  thumbnail_url?: string;
}

export default function ReelDiscussPage() {
  const params = useParams();
  const router = useRouter();
  const reelId = params.reelId as string;

  const [reel, setReel] = useState<Reel | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReelAndComments();
  }, [reelId]);

  const loadReelAndComments = async () => {
    setLoading(true);
    try {
      const [reelRes, commentsRes] = await Promise.all([
        api.get(`/api/reels/${reelId}`).catch(() => null),
        api.get(`/api/reels/${reelId}/comments`).catch(() => null),
      ]);
      if (reelRes) setReel(reelRes.data);
      if (commentsRes) setComments(commentsRes.data);
    } catch (error) {
      console.error('Failed to load reel discussion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/api/reels/${reelId}/comments`, { content: newComment });
      setNewComment('');
      loadReelAndComments();
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await api.post(`/api/comments/${commentId}/like`);
      loadReelAndComments();
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-gray-50 lg:pl-[72px]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/reels')}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Discussion</h1>
                <p className="text-sm text-gray-600">{reel?.title || 'Loading...'}</p>
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
              {/* Reel Info */}
              {reel && (
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{reel.title}</h2>
                  {reel.description && (
                    <p className="text-gray-700 mb-4">{reel.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {reel.creator_username[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold">{reel.creator_username}</span>
                  </div>
                </div>
              )}

              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
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
                  Comments ({comments.length})
                </h3>

                {comments.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">No comments yet. Be the first to share your thoughts!</p>
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
