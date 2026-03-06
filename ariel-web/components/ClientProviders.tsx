'use client';

import AuthProvider from './AuthProvider';
import { ArielProvider } from '@/lib/arielContext';
import ArielOverlay from './ArielOverlay';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ArielProvider>
        {children}
        <ArielOverlay />
      </ArielProvider>
    </AuthProvider>
  );
}
