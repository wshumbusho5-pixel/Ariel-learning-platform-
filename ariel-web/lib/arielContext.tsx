'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface ArielContextValue {
  isOpen: boolean;
  openAriel: () => void;
  closeAriel: () => void;
}

const ArielContext = createContext<ArielContextValue>({
  isOpen: false,
  openAriel: () => {},
  closeAriel: () => {},
});

export function ArielProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openAriel = useCallback(() => setIsOpen(true), []);
  const closeAriel = useCallback(() => setIsOpen(false), []);

  return (
    <ArielContext.Provider value={{ isOpen, openAriel, closeAriel }}>
      {children}
    </ArielContext.Provider>
  );
}

export function useAriel() {
  return useContext(ArielContext);
}
