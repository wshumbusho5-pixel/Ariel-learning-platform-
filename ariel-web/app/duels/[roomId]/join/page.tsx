'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Redirect page for duel challenge notifications.
 * /duels/:roomId/join  →  /duels?join=:roomId
 */
export default function DuelJoinRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const roomId = params?.roomId as string;
    if (roomId) {
      router.replace(`/duels?join=${roomId}`);
    } else {
      router.replace('/duels');
    }
  }, []);  // eslint-disable-line

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto" />
        <p className="text-zinc-400 text-sm">Joining duel...</p>
      </div>
    </div>
  );
}
