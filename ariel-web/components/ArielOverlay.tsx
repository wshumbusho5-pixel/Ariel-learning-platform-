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
    <div className="fixed inset-0 z-[200] flex flex-col justify-end lg:justify-center lg:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeAriel}
      />

      {/* Sheet */}
      <div
        className="relative w-full lg:max-w-2xl lg:mx-auto lg:rounded-3xl rounded-t-3xl bg-zinc-950 border border-zinc-800 overflow-hidden"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Drag handle / close bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <div className="w-8 h-1 bg-zinc-700 rounded-full lg:hidden" />
          <div className="hidden lg:block" />
          <button
            onClick={closeAriel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors ml-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92dvh - 56px)' }}>
          <div className="px-4 pb-8 lg:px-6">
            <ArielSpotlight />
          </div>
        </div>
      </div>
    </div>
  );
}
