'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuth((state) => state.checkAuth);

  useEffect(() => {
    console.log('🔑 AuthProvider: Checking authentication...');
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
