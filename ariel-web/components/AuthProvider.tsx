'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuth((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
