import { useState, useEffect, useRef, useCallback } from 'react';
import { searchCards, searchUsers } from '@/features/discover/api/discoverApi';
import type { TrendingCard, SearchUserResult } from '@/features/discover/api/discoverApi';

export type SearchTab = 'cards' | 'people';

interface UseSearchResult {
  query: string;
  setQuery: (q: string) => void;
  cardResults: TrendingCard[];
  userResults: SearchUserResult[];
  activeTab: SearchTab;
  setActiveTab: (tab: SearchTab) => void;
  isSearching: boolean;
}

export function useSearch(): UseSearchResult {
  const [query, setQueryState] = useState('');
  const [cardResults, setCardResults] = useState<TrendingCard[]>([]);
  const [userResults, setUserResults] = useState<SearchUserResult[]>([]);
  const [activeTab, setActiveTab] = useState<SearchTab>('cards');
  const [isSearching, setIsSearching] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();

    if (trimmed.length < 2) {
      setCardResults([]);
      setUserResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const [cards, users] = await Promise.all([
        searchCards(trimmed, 30),
        searchUsers(trimmed, 20),
      ]);
      setCardResults(cards);
      setUserResults(users);
    } catch {
      setCardResults([]);
      setUserResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (q.trim().length < 2) {
        setCardResults([]);
        setUserResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      debounceTimer.current = setTimeout(() => {
        runSearch(q);
      }, 300);
    },
    [runSearch],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    cardResults,
    userResults,
    activeTab,
    setActiveTab,
    isSearching,
  };
}
