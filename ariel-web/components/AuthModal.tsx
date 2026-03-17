'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError('');
  };

  const handleClose = () => {
    setError('');
    setEmail('');
    setPassword('');
    setUsername('');
    setFullName('');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setError('');
      setEmail('');
      setPassword('');
      setUsername('');
      setFullName('');
      setMode('login');

      // Lazy-load Google Identity Services script
      if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length > 72) {
      setError('Password is too long. Please use a password with less than 72 characters.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (mode === 'login') {
        response = await authAPI.login(email, password);
      } else {
        response = await authAPI.register(email, password, username, fullName);
      }

      localStorage.setItem('auth_token', response.access_token);
      onSuccess(response.user, response.access_token);
      onClose();
    } catch (err: any) {
      let errorMessage = err.response?.data?.detail || 'Authentication failed';

      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        errorMessage = 'Cannot reach the server. Is the backend running on port 8003?';
      }
      if (err.message?.includes('Network Error')) {
        errorMessage = 'Network error while contacting the server. Check API URL and backend.';
      }
      if (errorMessage.includes('72 bytes') || errorMessage.includes('truncate')) {
        errorMessage = 'Password is too long. Please use a shorter password (maximum 72 characters).';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const [oauthLoading, setOauthLoading] = useState(false);

  const handleGoogleLogin = () => {
    const google = (window as any).google;
    if (!google) {
      setError('Google sign-in is not available. Please try again.');
      return;
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: async (resp: any) => {
        if (!resp.access_token) {
          setError('Google sign-in was cancelled.');
          return;
        }
        setOauthLoading(true);
        setError('');
        try {
          const response = await authAPI.oauthLogin('google', resp.access_token);
          localStorage.setItem('auth_token', response.access_token);
          onSuccess(response.user, response.access_token);
          onClose();
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Google sign-in failed. Please try again.');
        } finally {
          setOauthLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-zinc-900 border border-[#2f3336] rounded-xl text-[#e7e9ea] placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors text-[15px]';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="bg-black border border-[#2f3336] rounded-2xl p-8 max-w-md w-full mx-4"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          {/* Ariel wordmark */}
          <span className="text-[22px] font-black italic tracking-tight" style={{ color: '#e7e9ea' }}>
            ar<span style={{ color: '#7c5cfc' }}>i</span>el
          </span>
          <button onClick={handleClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h2 className="text-[22px] font-black mb-1" style={{ color: '#e7e9ea' }}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-[14px] mb-6" style={{ color: '#8b9099' }}>
          {mode === 'login' ? 'Sign in to continue learning.' : 'Start learning smarter today.'}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[13px]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3" key={isOpen ? 'open' : 'closed'}>
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#8b9099' }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#8b9099' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  placeholder="johndoe"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#8b9099' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#8b9099' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                autoComplete="new-password"
                className={`${inputClass} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold rounded-full transition-colors text-[15px] mt-2"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-5 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2f3336]" />
          </div>
          <div className="relative flex justify-center text-[13px]">
            <span className="px-3 bg-black" style={{ color: '#8b9099' }}>or continue with</span>
          </div>
        </div>

        {/* OAuth */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleLogin}
            disabled={oauthLoading || loading}
            className="flex items-center justify-center px-4 py-2.5 border border-[#2f3336] rounded-xl hover:bg-zinc-900 disabled:opacity-60 transition-colors text-[14px] font-medium"
            style={{ color: '#e7e9ea' }}
          >
            {oauthLoading ? (
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {oauthLoading ? 'Signing in…' : 'Google'}
          </button>
          <button
            onClick={() => alert('GitHub login coming soon.')}
            className="flex items-center justify-center px-4 py-2.5 border border-[#2f3336] rounded-xl hover:bg-zinc-900 transition-colors text-[14px] font-medium"
            style={{ color: '#e7e9ea' }}
          >
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.840 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        {/* Toggle */}
        <div className="mt-5 text-center text-[14px]">
          <span style={{ color: '#8b9099' }}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="ml-1 font-bold hover:underline transition-all"
            style={{ color: '#e7e9ea' }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
