import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/shared/api/client';
import { CARDS } from '@/shared/api/endpoints';

const LIKED_KEY = 'ariel_liked';
const SAVED_KEY = 'ariel_saved';

async function getSet(key: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function saveSet(key: string, set: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // Silently fail — UI state is still correct
  }
}

interface UseCardActionsParams {
  cardId: string;
  initialLikes: number;
  initialSaves: number;
  initialLiked?: boolean;
  initialSaved?: boolean;
}

interface UseCardActionsReturn {
  liked: boolean;
  saved: boolean;
  likeCount: number;
  saveCount: number;
  handleLike: () => Promise<void>;
  handleSave: () => Promise<void>;
  likeAnim: Animated.Value;
}

export function useCardActions({
  cardId,
  initialLikes,
  initialSaves,
  initialLiked = false,
  initialSaved = false,
}: UseCardActionsParams): UseCardActionsReturn {
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [saveCount, setSaveCount] = useState(initialSaves);

  // Animated value for heart bounce
  const likeAnim = useRef(new Animated.Value(1)).current;

  // Load persisted state from AsyncStorage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [likedSet, savedSet] = await Promise.all([
        getSet(LIKED_KEY),
        getSet(SAVED_KEY),
      ]);
      if (cancelled) return;
      if (likedSet.has(cardId)) {
        setLiked(true);
      }
      if (savedSet.has(cardId)) {
        setSaved(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  const handleLike = async () => {
    const prevLiked = liked;
    const prevCount = likeCount;

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));

    // Bounce animation
    Animated.sequence([
      Animated.spring(likeAnim, {
        toValue: 1.4,
        useNativeDriver: true,
        speed: 40,
        bounciness: 20,
      }),
      Animated.spring(likeAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
    ]).start();

    // Persist to AsyncStorage
    const likedSet = await getSet(LIKED_KEY);
    if (newLiked) {
      likedSet.add(cardId);
    } else {
      likedSet.delete(cardId);
    }
    await saveSet(LIKED_KEY, likedSet);

    // API call
    try {
      await apiClient.post(CARDS.like(cardId));
    } catch {
      // Revert optimistic update on failure
      setLiked(prevLiked);
      setLikeCount(prevCount);
      const likedSetRevert = await getSet(LIKED_KEY);
      if (prevLiked) {
        likedSetRevert.add(cardId);
      } else {
        likedSetRevert.delete(cardId);
      }
      await saveSet(LIKED_KEY, likedSetRevert);
    }
  };

  const handleSave = async () => {
    const prevSaved = saved;
    const prevCount = saveCount;

    // Optimistic update
    const newSaved = !saved;
    setSaved(newSaved);
    setSaveCount((c) => (newSaved ? c + 1 : Math.max(0, c - 1)));

    // Persist to AsyncStorage
    const savedSet = await getSet(SAVED_KEY);
    if (newSaved) {
      savedSet.add(cardId);
    } else {
      savedSet.delete(cardId);
    }
    await saveSet(SAVED_KEY, savedSet);

    // API call
    try {
      await apiClient.post(CARDS.save(cardId));
    } catch {
      // Revert optimistic update on failure
      setSaved(prevSaved);
      setSaveCount(prevCount);
      const savedSetRevert = await getSet(SAVED_KEY);
      if (prevSaved) {
        savedSetRevert.add(cardId);
      } else {
        savedSetRevert.delete(cardId);
      }
      await saveSet(SAVED_KEY, savedSetRevert);
    }
  };

  return { liked, saved, likeCount, saveCount, handleLike, handleSave, likeAnim };
}
