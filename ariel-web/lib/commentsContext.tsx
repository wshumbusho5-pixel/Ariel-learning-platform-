'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface CommentsContextValue {
  cardId: string | null;
  openComments: (cardId: string) => void;
  closeComments: () => void;
}

const CommentsContext = createContext<CommentsContextValue>({
  cardId: null,
  openComments: () => {},
  closeComments: () => {},
});

export function CommentsProvider({ children }: { children: React.ReactNode }) {
  const [cardId, setCardId] = useState<string | null>(null);
  const openComments = useCallback((id: string) => setCardId(id), []);
  const closeComments = useCallback(() => setCardId(null), []);

  return (
    <CommentsContext.Provider value={{ cardId, openComments, closeComments }}>
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments() {
  return useContext(CommentsContext);
}
