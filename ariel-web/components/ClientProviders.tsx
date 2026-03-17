'use client';

import dynamic from 'next/dynamic';
import AuthProvider from './AuthProvider';
import { ArielProvider } from '@/lib/arielContext';
import { CommentsProvider } from '@/lib/commentsContext';
import ArielOverlay from './ArielOverlay';
import CommentsDrawer from './CommentsDrawer';

// Load GoogleOAuthProvider only on the client to avoid SSR crashes
const GoogleProvider = dynamic(() => import('./GoogleProvider'), { ssr: false });

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <GoogleProvider>
      <AuthProvider>
        <ArielProvider>
          <CommentsProvider>
            {children}
            <ArielOverlay />
            <CommentsDrawer />
          </CommentsProvider>
        </ArielProvider>
      </AuthProvider>
    </GoogleProvider>
  );
}
