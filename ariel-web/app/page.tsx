'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/lib/useAuth';
import ArielLogo from '@/components/ArielLogo';

// Sample cards that rotate in the preview
const PREVIEW_CARDS = [
  { subject: 'Biology', gradient: 'from-emerald-500 to-green-400', q: 'What does chlorophyll do?', a: 'Captures light energy to power photosynthesis.' },
  { subject: 'Economics', gradient: 'from-violet-500 to-purple-400', q: 'What is inflation?', a: 'A general rise in the price level of goods and services.' },
  { subject: 'History', gradient: 'from-stone-500 to-stone-400', q: 'When did WW2 end?', a: 'September 2, 1945 — with Japan\'s formal surrender.' },
  { subject: 'Mathematics', gradient: 'from-indigo-500 to-emerald-400', q: 'What is the Pythagorean theorem?', a: 'a² + b² = c², relating the sides of a right triangle.' },
  { subject: 'Technology', gradient: 'from-zinc-600 to-zinc-400', q: 'What is an API?', a: 'A set of rules that lets software applications communicate.' },
];

function PreviewStack() {
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFlipped(false);
      setTimeout(() => {
        setActive(i => (i + 1) % PREVIEW_CARDS.length);
      }, 300);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 1200);
    return () => clearTimeout(t);
  }, [active]);

  const card = PREVIEW_CARDS[active];
  const next = PREVIEW_CARDS[(active + 1) % PREVIEW_CARDS.length];
  const next2 = PREVIEW_CARDS[(active + 2) % PREVIEW_CARDS.length];

  return (
    <div className="relative w-[260px] h-[168px] mx-auto select-none">
      {/* Card 3 (furthest back) */}
      <div
        className="absolute inset-0 rounded-2xl border border-zinc-200 bg-white shadow-sm"
        style={{ transform: 'translate(10px, 10px) rotate(3deg)', zIndex: 1 }}
      >
        <div className={`h-[3px] w-full rounded-t-2xl bg-gradient-to-r ${next2.gradient}`} />
      </div>
      {/* Card 2 */}
      <div
        className="absolute inset-0 rounded-2xl border border-zinc-200 bg-white shadow-sm"
        style={{ transform: 'translate(5px, 5px) rotate(1.5deg)', zIndex: 2 }}
      >
        <div className={`h-[3px] w-full rounded-t-2xl bg-gradient-to-r ${next.gradient}`} />
      </div>
      {/* Active card */}
      <div className="absolute inset-0 rounded-2xl border border-zinc-200 bg-white shadow-md overflow-hidden cursor-pointer" style={{ zIndex: 3 }} onClick={() => setFlipped(f => !f)}>
        <div className={`h-[3px] w-full bg-gradient-to-r ${card.gradient}`} />
        <div className="px-5 py-4 h-full flex flex-col justify-between">
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
              {card.subject}
            </span>
            <p className={`text-[13px] font-bold text-zinc-900 mt-1 leading-snug transition-all duration-300 ${flipped ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
              {card.q}
            </p>
            <p className={`text-[13px] text-zinc-700 mt-1 leading-snug transition-all duration-300 absolute ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`} style={{ top: '2.6rem' }}>
              {card.a}
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-[9px] text-zinc-300 font-medium">tap to {flipped ? 'hide' : 'reveal'}</span>
            <div className="flex gap-1">
              {PREVIEW_CARDS.map((_, i) => (
                <div key={i} className={`w-1 h-1 rounded-full transition-colors ${i === active ? 'bg-zinc-600' : 'bg-zinc-200'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, checkAuth } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-100 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  const openSignup = () => { setAuthMode('signup'); setShowAuthModal(true); };
  const openLogin  = () => { setAuthMode('login');  setShowAuthModal(true); };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user, token) => {
          login(user, token);
          router.push('/dashboard');
        }}
      />

      {/* ── Mobile layout (default) ─────────────────────────────────── */}
      <div className="flex flex-col items-center justify-between min-h-screen px-6 py-10 lg:hidden">

        {/* Top: wordmark */}
        <div className="flex flex-col items-center pt-6">
          <ArielLogo size={60} variant="light" bgColor="#ffffff" showTagline />
        </div>

        {/* Middle: live preview */}
        <div className="flex flex-col items-center gap-6 w-full">
          <PreviewStack />
          <p className="text-zinc-400 text-sm text-center font-medium">
            Learn smarter. One card at a time.
          </p>
        </div>

        {/* Bottom: CTAs */}
        <div className="w-full space-y-3 pb-4">
          <button
            onClick={openSignup}
            className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[15px] transition-colors"
          >
            Create new account
          </button>
          <button
            onClick={openLogin}
            className="w-full py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-zinc-800 font-bold text-[15px] transition-colors"
          >
            Log in
          </button>
          <p className="text-center text-[11px] text-zinc-300 pt-1">
            By signing up you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>

      {/* ── Desktop layout ───────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen">

        {/* Left: brand + actions */}
        <div className="flex-1 flex flex-col justify-center px-20 max-w-lg">
          <div className="mb-16">
            <ArielLogo size={72} variant="light" bgColor="#ffffff" showTagline />
          </div>

          <div className="space-y-3 w-full max-w-[360px]">
            <button
              onClick={openSignup}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[15px] transition-colors"
            >
              Create new account
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-zinc-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              onClick={openLogin}
              className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-zinc-800 font-bold text-[15px] transition-colors"
            >
              Log in
            </button>
          </div>

          <p className="text-[11px] text-zinc-300 mt-5 max-w-[360px]">
            By signing up you agree to our Terms and Privacy Policy.
          </p>
        </div>

        {/* Right: live preview */}
        <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center gap-8 border-l border-gray-100">
          <div className="text-center mb-2">
            <p className="text-zinc-400 text-sm font-medium">Learn smarter. One card at a time.</p>
          </div>
          <PreviewStack />
        </div>
      </div>
    </main>
  );
}
