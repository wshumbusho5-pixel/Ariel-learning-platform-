'use client';

import { useState, useEffect } from 'react';
import { commentsAPI } from '@/lib/api';
import { parseUTC } from '@/lib/time';
import Link from 'next/link';

interface Comment {
  id: string;
  deck_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  author_username?: string;
  author_full_name?: string;
  author_profile_picture?: string;
  author_is_verified: boolean;
  likes: number;
  is_liked_by_current_user: boolean;
  reply_count: number;
  is_edited: boolean;
  edited_at?: string;
  is_author: boolean;
  created_at: string;
}

interface CommentsSectionProps {
  deckId: string;
}

export default function CommentsSection({ deckId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});

  useEffect(() => {
    loadComments();
  }, [deckId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await commentsAPI.getDeckComments(deckId, 50, 0, true);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReplies = async (commentId: string) => {
    try {
      const data = await commentsAPI.getCommentReplies(commentId);
      setReplies({ ...replies, [commentId]: data });
      setExpandedComments(new Set(expandedComments).add(commentId));
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;

    try {
      setIsSubmitting(true);
      const newComment = await commentsAPI.createComment(deckId, newCommentContent);
      setComments([newComment, ...comments]);
      setNewCommentContent('');
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim()) return;

    try {
      setIsSubmitting(true);
      const newReply = await commentsAPI.createComment(deckId, replyContent, parentCommentId);

      // Add reply to replies list
      const currentReplies = replies[parentCommentId] || [];
      setReplies({ ...replies, [parentCommentId]: [...currentReplies, newReply] });

      // Update reply count on parent comment
      setComments(comments.map(c =>
        c.id === parentCommentId ? { ...c, reply_count: c.reply_count + 1 } : c
      ));

      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    try {
      const result = await commentsAPI.toggleLike(commentId);

      if (isReply && parentId) {
        // Update reply
        setReplies({
          ...replies,
          [parentId]: replies[parentId].map(r =>
            r.id === commentId
              ? { ...r, likes: result.likes, is_liked_by_current_user: result.action === 'liked' }
              : r
          )
        });
      } else {
        // Update comment
        setComments(comments.map(c =>
          c.id === commentId
            ? { ...c, likes: result.likes, is_liked_by_current_user: result.action === 'liked' }
            : c
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDelete = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await commentsAPI.deleteComment(commentId);

      if (isReply && parentId) {
        // Remove reply
        setReplies({
          ...replies,
          [parentId]: replies[parentId].filter(r => r.id !== commentId)
        });
      } else {
        // Remove comment
        setComments(comments.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - parseUTC(dateString).getTime()) / 1000);
    if (seconds < 0) return 'just now';
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return parseUTC(dateString).toLocaleDateString();
  };

  const renderComment = (comment: Comment, isReply: boolean = false, parentId?: string) => (
    <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : 'mb-4'}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/profile/${comment.user_id}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-zinc-400 flex items-center justify-center text-white font-bold">
            {comment.author_profile_picture ? (
              <img
                src={comment.author_profile_picture}
                alt={comment.author_username || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (comment.author_username?.[0] || comment.author_full_name?.[0] || 'U').toUpperCase()
            )}
          </div>
        </Link>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 rounded-2xl px-4 py-2">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/profile/${comment.user_id}`} className="font-semibold text-gray-900 text-sm hover:underline">
                {comment.author_username || comment.author_full_name || 'User'}
              </Link>
              {comment.author_is_verified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {comment.is_author && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  You
                </span>
              )}
            </div>
            <p className="text-gray-900 text-sm whitespace-pre-wrap">{comment.content}</p>
            {comment.is_edited && (
              <p className="text-xs text-gray-500 mt-1">(edited)</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 px-2">
            <button
              onClick={() => handleToggleLike(comment.id, isReply, parentId)}
              className={`text-xs font-medium ${
                comment.is_liked_by_current_user ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {comment.is_liked_by_current_user ? '❤️' : '🤍'} {comment.likes > 0 && comment.likes}
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="text-xs font-medium text-gray-600 hover:text-blue-600"
              >
                Reply
              </button>
            )}

            <span className="text-xs text-gray-500">{getTimeAgo(comment.created_at)}</span>

            {comment.is_author && (
              <button
                onClick={() => handleDelete(comment.id, isReply, parentId)}
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>

          {/* Show Replies Button */}
          {!isReply && comment.reply_count > 0 && (
            <button
              onClick={() => {
                if (expandedComments.has(comment.id)) {
                  const newExpanded = new Set(expandedComments);
                  newExpanded.delete(comment.id);
                  setExpandedComments(newExpanded);
                } else {
                  loadReplies(comment.id);
                }
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 mt-2 px-2"
            >
              {expandedComments.has(comment.id) ? '▼' : '▶'} {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
            </button>
          )}

          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={isSubmitting || !replyContent.trim()}
                  className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {expandedComments.has(comment.id) && replies[comment.id] && (
            <div className="mt-3">
              {replies[comment.id].map(reply => renderComment(reply, true, comment.id))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl p-6 mt-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        💬 Comments ({comments.length})
      </h3>

      {/* New Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <textarea
          value={newCommentContent}
          onChange={(e) => setNewCommentContent(e.target.value)}
          placeholder="Add a comment..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newCommentContent.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
        </div>
      )}

      {!isLoading && comments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No comments yet. Be the first to comment!</p>
        </div>
      )}

      {!isLoading && comments.length > 0 && (
        <div>
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
