'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function GoogleProvider({ children }: { children: React.ReactNode }) {
  // Don't render GoogleOAuthProvider if no client ID — prevents crash
  if (!CLIENT_ID) {
    return <>{children}</>;
  }
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}
