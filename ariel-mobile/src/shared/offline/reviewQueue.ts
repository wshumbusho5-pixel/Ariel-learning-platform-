import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiClient from '@/shared/api/client';
import { CARDS } from '@/shared/api/endpoints';

const QUEUE_KEY = '@ariel/offline-review-queue';

interface QueuedReview {
  cardId: string;
  quality: 0 | 1 | 2 | 3 | 4 | 5;
  timestamp: number;
}

async function getQueue(): Promise<QueuedReview[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue: QueuedReview[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Add a review to the offline queue */
export async function enqueueReview(cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5): Promise<void> {
  const queue = await getQueue();
  // Replace any existing review for the same card (latest wins)
  const filtered = queue.filter((r) => r.cardId !== cardId);
  filtered.push({ cardId, quality, timestamp: Date.now() });
  await saveQueue(filtered);
}

/** Flush all queued reviews to the server. Returns count of successfully synced reviews. */
export async function flushReviewQueue(): Promise<number> {
  const queue = await getQueue();
  if (queue.length === 0) return 0;

  const remaining: QueuedReview[] = [];
  let synced = 0;

  for (const review of queue) {
    try {
      await apiClient.post(CARDS.review(review.cardId), { quality: review.quality });
      synced++;
    } catch {
      // Keep failed reviews in queue for next attempt
      remaining.push(review);
    }
  }

  await saveQueue(remaining);
  return synced;
}

/** Check connectivity and flush if online */
export async function syncIfOnline(): Promise<number> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return 0;
  return flushReviewQueue();
}

/** Get the number of pending offline reviews */
export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
