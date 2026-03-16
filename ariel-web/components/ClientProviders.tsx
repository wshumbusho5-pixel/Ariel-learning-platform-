'use client';

import AuthProvider from './AuthProvider';
import { ArielProvider } from '@/lib/arielContext';
import { CommentsProvider } from '@/lib/commentsContext';
import ArielOverlay from './ArielOverlay';
import CommentsDrawer from './CommentsDrawer';
import GoogleProvider from './GoogleProvider';

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
