import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import { CARDS } from '@/shared/api/endpoints';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type { CardReview } from '@/shared/types/card';

interface ReviewPayload {
  cardId: string;
  quality: 0 | 1 | 2 | 3 | 4 | 5;
}

export function useReviewCard() {
  const queryClient = useQueryClient();

  const mutation = useMutation<CardReview, Error, ReviewPayload>({
    mutationFn: async ({ cardId, quality }) => {
      const res = await apiClient.post<CardReview>(CARDS.review(cardId), {
        quality,
      });
      return res.data;
    },
    onSuccess: () => {
      // Invalidate all my-deck queries so next visit is fresh
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CARDS.myDeck(),
      });
    },
  });

  const reviewCard = (cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    mutation.mutate({ cardId, quality });
  };

  return {
    reviewCard,
    isReviewing: mutation.isPending,
    reviewError: mutation.error,
  };
}
