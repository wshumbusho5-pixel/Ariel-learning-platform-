'use client';

import { useEffect } from 'react';
import { useAriel } from '@/lib/arielContext';
import ArielSpotlight from './ArielSpotlight';

export default function ArielOverlay() {
  const { isOpen, closeAriel } = useAriel();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <ArielSpotlight onClose={closeAriel} />
    </div>
  );
}
