import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/shared/api/client';
import { COMMENTS } from '@/shared/api/endpoints';
import type { CommentWithAuthor } from '@/shared/types/comment';

interface UseCardCommentsReturn {
  comments: CommentWithAuthor[];
  loading: boolean;
  postComment: (content: string) => Promise<void>;
  postingComment: boolean;
}

export function useCardComments(cardId: string): UseCardCommentsReturn {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiClient
      .get<CommentWithAuthor[]>(COMMENTS.CARD(cardId))
      .then((res) => {
        if (!cancelled) {
          setComments(res.data);
        }
      })
      .catch(() => {
        // Silently handle — comments section just stays empty
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cardId]);

  const postComment = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setPostingComment(true);

      // Optimistic append (temporary ID)
      const tempComment: CommentWithAuthor = {
        id: `temp_${Date.now()}`,
        deck_id: cardId,
        user_id: 'me',
        content: content.trim(),
        parent_comment_id: null,
        author_username: null,
        author_full_name: null,
        author_profile_picture: null,
        author_is_verified: false,
        likes: 0,
        is_liked_by_current_user: false,
        reply_count: 0,
        is_edited: false,
        edited_at: null,
        is_author: true,
        created_at: new Date().toISOString(),
      };
      setComments((prev) => [...prev, tempComment]);

      try {
        const res = await apiClient.post<CommentWithAuthor>(
          COMMENTS.CARD(cardId),
          { content: content.trim() },
        );
        // Replace temp with real comment
        setComments((prev) =>
          prev.map((c) => (c.id === tempComment.id ? res.data : c)),
        );
      } catch {
        // Revert optimistic comment
        setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
      } finally {
        setPostingComment(false);
      }
    },
    [cardId],
  );

  return { comments, loading, postComment, postingComment };
}
