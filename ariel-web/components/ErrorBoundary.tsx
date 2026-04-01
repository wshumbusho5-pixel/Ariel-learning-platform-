'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <DefaultFallback
          error={this.state.error}
          onReset={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

function DefaultFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-white text-xl font-black mb-2">Something went wrong</h2>
        {error?.message && (
          <p className="text-zinc-500 text-xs font-mono mb-4 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-left break-all">
            {error.message}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onReset}
            className="px-5 py-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
