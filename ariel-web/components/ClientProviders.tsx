'use client';

import AuthProvider from './AuthProvider';
import { ArielProvider } from '@/lib/arielContext';
import { CommentsProvider } from '@/lib/commentsContext';
import ArielOverlay from './ArielOverlay';
import CommentsDrawer from './CommentsDrawer';
import ErrorBoundary from './ErrorBoundary';
import { ToastProvider } from './Toast';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ArielProvider>
            <CommentsProvider>
              {children}
              <ArielOverlay />
              <CommentsDrawer />
            </CommentsProvider>
          </ArielProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
