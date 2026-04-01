'use client';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export default function ErrorView({
  message = 'Failed to load. Check your connection.',
  onRetry,
  fullPage = false,
}: ErrorViewProps) {
  const wrapper = fullPage
    ? 'min-h-[60vh] flex items-center justify-center'
    : 'flex items-center justify-center py-16';

  return (
    <div className={wrapper}>
      <div className="text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-zinc-400 text-sm mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition-colors border border-zinc-700"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
