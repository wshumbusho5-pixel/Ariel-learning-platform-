'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-zinc-900 border-emerald-500/40 text-emerald-400',
  error: 'bg-zinc-900 border-red-500/40 text-red-400',
  info: 'bg-zinc-900 border-zinc-600/60 text-zinc-300',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl text-sm font-medium max-w-xs w-full animate-[slideUp_0.25s_ease-out] ${COLORS[toast.type]}`}
      role="alert"
      aria-live="polite"
    >
      {ICONS[toast.type]}
      <span className="flex-1 text-white text-[13px]">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-zinc-600 hover:text-zinc-400 ml-1 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timerRef.current.get(id);
    if (timer) { clearTimeout(timer); timerRef.current.delete(id); }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    const timer = setTimeout(() => removeToast(id), 3000);
    timerRef.current.set(id, timer);
  }, [removeToast]);

  const value: ToastContextValue = {
    addToast,
    success: useCallback((msg) => addToast(msg, 'success'), [addToast]),
    error: useCallback((msg) => addToast(msg, 'error'), [addToast]),
    info: useCallback((msg) => addToast(msg, 'info'), [addToast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — bottom-center on mobile, bottom-right on desktop */}
      <div
        className="fixed bottom-20 left-1/2 -translate-x-1/2 lg:bottom-6 lg:right-6 lg:left-auto lg:translate-x-0 z-[9999] flex flex-col gap-2 items-center lg:items-end pointer-events-none"
        aria-label="Notifications"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
