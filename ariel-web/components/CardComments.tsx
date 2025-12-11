'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';

interface Comment {
  id: string;
  user_id: string;
  username: string;
  profile_picture?: string;
  text: string;
  created_at: string;
  likes: number;
  replies_count: number;
  liked_by_current_user?: boolean;
}

interface CardCommentsProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CardComments({ cardId, isOpen, onClose }: CardCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, cardId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8003/api/cards/${cardId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8003/api/cards/${cardId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newComment.trim() }),
      });

      if (response.ok) {
        setNewComment('');
        loadComments();
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8003/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setComments(comments.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                likes: comment.liked_by_current_user ? comment.likes - 1 : comment.likes + 1,
                liked_by_current_user: !comment.liked_by_current_user
              }
            : comment
        ));
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return `${weeks}w`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center">
      {/* Modal Container - Instagram/TikTok Style */}
      <div className="bg-white w-full md:max-w-lg md:rounded-t-3xl rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            Comments {comments.length > 0 && `(${comments.length})`}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-gray-300 border-t-black rounded-full animate-spin"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">No comments yet</p>
              <p className="text-xs text-gray-500 mt-1">Be the first to comment!</p>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      {comment.profile_picture ? (
                        <img
                          src={comment.profile_picture}
                          alt={comment.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {comment.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900">{comment.username}</span>
                          <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-900 leading-relaxed">{comment.text}</p>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mt-2">
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                          >
                            {comment.likes > 0 && (
                              <span className={comment.liked_by_current_user ? 'text-red-500' : ''}>
                                {comment.likes}
                              </span>
                            )}
                            <span className={comment.liked_by_current_user ? 'text-red-500' : ''}>
                              {comment.likes > 0 ? 'likes' : 'Like'}
                            </span>
                          </button>
                          {comment.replies_count > 0 && (
                            <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                              View {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Like Heart Icon */}
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className="flex-shrink-0"
                      >
                        <svg
                          className={`w-4 h-4 transition-all ${
                            comment.liked_by_current_user
                              ? 'fill-red-500 text-red-500 scale-110'
                              : 'fill-none text-gray-400 hover:text-gray-600'
                          }`}
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input - Instagram Style */}
        <div className="border-t border-gray-200 p-3">
          <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>

            {/* Input */}
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
              maxLength={500}
            />

            {/* Post Button */}
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className={`text-sm font-semibold transition-colors ${
                newComment.trim() && !submitting
                  ? 'text-blue-500 hover:text-blue-600'
                  : 'text-blue-300 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
