'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/lib/useAuth';
import ArielWordmark from '@/components/ArielWordmark';

// ─── Feed data ────────────────────────────────────────────────────────────────

const FEED_ITEMS = [
  {
    type: 'card',
    author: 'Sarah K.',
    avatar: 'S',
    subject: 'Economics',
    subjectColor: '#a78bfa',
    caption: 'Key concept for the exam tomorrow 👇',
    q: 'What is inflation?',
    a: 'A sustained rise in price levels across an economy over time.',
  },
  {
    type: 'reel',
    author: 'Prof. James',
    avatar: 'J',
    subject: 'Biology',
    title: 'How DNA replication works',
    gradient: 'linear-gradient(160deg,#064e3b,#065f46)',
    views: '4.1k',
    likes: 847,
  },
  {
    type: 'card',
    author: 'Alex M.',
    avatar: 'A',
    subject: 'History',
    subjectColor: '#f59e0b',
    caption: 'This changed everything in modern history',
    q: 'What triggered World War 1?',
    a: 'The assassination of Archduke Franz Ferdinand in Sarajevo, June 1914.',
  },
  {
    type: 'reel',
    author: 'TechTalks',
    avatar: 'T',
    subject: 'Technology',
    title: 'Machine Learning in 60 seconds',
    gradient: 'linear-gradient(160deg,#1e1b4b,#4338ca)',
    views: '8.7k',
    likes: 1203,
  },
  {
    type: 'card',
    author: 'Mike R.',
    avatar: 'M',
    subject: 'Mathematics',
    subjectColor: '#818cf8',
    caption: 'Calculus fundamentals — save this',
    q: 'What is the derivative of x²?',
    a: '2x — by the power rule: d/dx[xⁿ] = nxⁿ⁻¹',
  },
  {
    type: 'reel',
    author: 'BizSchool',
    avatar: 'B',
    subject: 'Business',
    title: 'Supply & Demand explained simply',
    gradient: 'linear-gradient(160deg,#78350f,#92400e)',
    views: '3.8k',
    likes: 612,
  },
] as const;

type FeedItem = typeof FEED_ITEMS[number];

// ─── Reach arcs SVG icon ──────────────────────────────────────────────────────

function ReachIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 12 C2 7, 5 4, 8 4" opacity="0.4" />
      <path d="M2 12 C2 6, 7 2, 12 4" opacity="0.7" />
      <path d="M2 12 C4 8, 9 5, 14 8" />
    </svg>
  );
}

// ─── Heart SVG ────────────────────────────────────────────────────────────────

function HeartIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5s-6-3.8-6-7.5a4 4 0 0 1 6-3.4A4 4 0 0 1 14 6c0 3.7-6 7.5-6 7.5z" />
    </svg>
  );
}

// ─── Bookmark SVG ─────────────────────────────────────────────────────────────

function BookmarkIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h10v13l-5-3-5 3V2z" />
    </svg>
  );
}

// ─── Play SVG ─────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
      <path d="M5.5 3.5l8 4.5-8 4.5V3.5z" />
    </svg>
  );
}

// ─── Feed item renderers ──────────────────────────────────────────────────────

function AuthorRow({ avatar, author, subject, subjectColor }: { avatar: string; author: string; subject: string; subjectColor: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{ width: 22, height: 22, background: '#3f3f46', fontSize: 9, fontWeight: 700, color: '#fff' }}
      >
        {avatar}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#e7e9ea' }}>{author}</span>
      <span
        className="rounded-full"
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: subjectColor,
          border: `1px solid ${subjectColor}66`,
          paddingLeft: 5,
          paddingRight: 5,
          paddingTop: 2,
          paddingBottom: 2,
          lineHeight: 1,
        }}
      >
        {subject}
      </span>
    </div>
  );
}

function ActionRow({ likes }: { likes?: number }) {
  return (
    <div className="flex items-center gap-3 mt-2" style={{ color: '#71717a' }}>
      <button className="flex items-center gap-1 hover:text-rose-400 transition-colors">
        <HeartIcon />
        {likes !== undefined && <span style={{ fontSize: 10 }}>{likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}</span>}
      </button>
      <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
        <ReachIcon />
      </button>
      <button className="flex items-center gap-1 hover:text-amber-400 transition-colors ml-auto">
        <BookmarkIcon />
      </button>
    </div>
  );
}

function CardFeedItem({ item, flipped }: { item: Extract<FeedItem, { type: 'card' }>; flipped: boolean }) {
  return (
    <div>
      <AuthorRow avatar={item.avatar} author={item.author} subject={item.subject} subjectColor={item.subjectColor} />
      <p style={{ fontSize: 11, color: '#8b9099', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.caption}
      </p>
      {/* White card */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 12,
          padding: '10px 10px 10px 14px',
          minHeight: 80,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 4px rgba(0,0,0,0.12)',
        }}
      >
        {/* Left accent */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 3, background: item.subjectColor, borderRadius: '12px 0 0 12px' }}
        />
        {/* Question */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#18181b',
            lineHeight: 1.35,
            transition: 'opacity 0.3s, transform 0.3s',
            opacity: flipped ? 0 : 1,
            transform: flipped ? 'translateY(4px)' : 'translateY(0)',
            position: flipped ? 'absolute' : 'relative',
          }}
        >
          {item.q}
        </p>
        {/* Answer */}
        <p
          style={{
            fontSize: 11,
            color: '#52525b',
            lineHeight: 1.4,
            transition: 'opacity 0.3s, transform 0.3s',
            opacity: flipped ? 1 : 0,
            transform: flipped ? 'translateY(0)' : 'translateY(-4px)',
            position: flipped ? 'relative' : 'absolute',
          }}
        >
          {item.a}
        </p>
      </div>
      <ActionRow />
    </div>
  );
}

function ReelFeedItem({ item }: { item: Extract<FeedItem, { type: 'reel' }>; }) {
  return (
    <div>
      <AuthorRow avatar={item.avatar} author={item.author} subject={item.subject} subjectColor="#a1a1aa" />
      {/* Video thumbnail */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 12,
          height: 118,
          background: item.gradient,
        }}
      >
        {/* Subject pill */}
        <div
          className="absolute top-2 left-2"
          style={{
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            borderRadius: 999,
            fontSize: 9,
            color: '#fff',
            padding: '2px 7px',
          }}
        >
          {item.subject}
        </div>
        {/* Play button */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(4px)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlayIcon />
          </div>
        </div>
        {/* Bottom overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 px-2 pb-2"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))' }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{item.title}</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{item.views} views</p>
        </div>
      </div>
      <ActionRow likes={item.likes} />
    </div>
  );
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timers helper
  const clearTimers = () => {
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    if (advanceTimerRef.current) clearInterval(advanceTimerRef.current);
  };

  useEffect(() => {
    clearTimers();
    setFlipped(false);

    const currentItem = FEED_ITEMS[activeIndex];
    // Auto-flip cards at 1500ms
    if (currentItem.type === 'card') {
      flipTimerRef.current = setTimeout(() => setFlipped(true), 1500);
    }

    // Advance every 3000ms
    advanceTimerRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveIndex(i => (i + 1) % FEED_ITEMS.length);
        setVisible(true);
      }, 300);
    }, 3000);

    return clearTimers;
  }, [activeIndex]);

  const item = FEED_ITEMS[activeIndex];

  return (
    <div
      style={{
        width: 260,
        height: 500,
        borderRadius: 36,
        border: '1.5px solid rgba(255,255,255,0.12)',
        background: '#000',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 18,
          paddingRight: 18,
          paddingTop: 12,
          paddingBottom: 4,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, color: '#71717a', fontWeight: 600 }}>9:41</span>
        <span style={{ fontSize: 10, color: '#71717a' }}>• • •</span>
      </div>

      {/* Mini wordmark */}
      <div style={{ textAlign: 'center', paddingBottom: 8, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 13,
            fontStyle: 'italic',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: 1,
          }}
        >
          ar<span style={{ color: '#9B7FFF' }}>i</span>el
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 10, flexShrink: 0 }} />

      {/* Feed item */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          paddingLeft: 12,
          paddingRight: 12,
          paddingBottom: 12,
          transition: 'opacity 0.3s, transform 0.3s',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
        }}
      >
        {item.type === 'card' ? (
          <CardFeedItem item={item as Extract<FeedItem, { type: 'card' }>} flipped={flipped} />
        ) : (
          <ReelFeedItem item={item as Extract<FeedItem, { type: 'reel' }>} />
        )}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, paddingBottom: 14, flexShrink: 0 }}>
        {FEED_ITEMS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === activeIndex ? 12 : 4,
              height: 4,
              borderRadius: 999,
              background: i === activeIndex ? '#9B7FFF' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-800 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  const openSignup = () => { setAuthMode('signup'); setShowAuthModal(true); };
  const openLogin  = () => { setAuthMode('login');  setShowAuthModal(true); };

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user, token) => {
          login(user, token);
          router.push('/dashboard');
        }}
      />

      {/* ── Mobile layout ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-center min-h-screen px-6 lg:hidden" style={{ paddingTop: 48, paddingBottom: 32 }}>

        {/* Wordmark */}
        <div className="flex justify-center mb-6">
          <ArielWordmark size={52} variant="dark" showTagline={false} animate />
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1
            style={{
              fontSize: 38,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              whiteSpace: 'pre-line',
            }}
          >
            {'Learn anything.\nFaster.'}
          </h1>
          <p style={{ fontSize: 15, color: '#8b9099', marginTop: 8 }}>Cards. Clips. Community.</p>
        </div>

        {/* Phone mockup */}
        <div className="flex justify-center mb-8">
          <PhoneMockup />
        </div>

        {/* CTAs */}
        <div className="w-full mt-auto">
          <button
            onClick={openSignup}
            style={{
              width: '100%',
              background: '#fff',
              color: '#000',
              borderRadius: 999,
              padding: '14px 0',
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'block',
            }}
          >
            Create account
          </button>
          <button
            onClick={openLogin}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#e7e9ea',
              borderRadius: 999,
              padding: '14px 0',
              fontSize: 15,
              fontWeight: 700,
              border: '1px solid #3f3f46',
              cursor: 'pointer',
              display: 'block',
              marginTop: 12,
            }}
          >
            Log in
          </button>
          <p style={{ fontSize: 11, color: '#8b9099', textAlign: 'center', marginTop: 16 }}>
            By signing up you agree to our{' '}
            <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Terms</span>
            {' '}and{' '}
            <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>
      </div>

      {/* ── Desktop layout ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen items-center">

        {/* Left column */}
        <div className="flex-1 flex flex-col justify-center" style={{ paddingLeft: 80, paddingRight: 60, maxWidth: 560 }}>
          <div style={{ marginBottom: 40 }}>
            <ArielWordmark size={52} variant="dark" showTagline={false} animate />
          </div>

          <h1
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              marginBottom: 16,
            }}
          >
            Learn anything.<br />Faster.
          </h1>
          <p style={{ fontSize: 18, color: '#8b9099', marginBottom: 40 }}>Cards. Clips. Community.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
            <button
              onClick={openSignup}
              style={{
                background: '#fff',
                color: '#000',
                borderRadius: 999,
                padding: '14px 0',
                fontSize: 15,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Create account
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 12, color: '#52525b', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <button
              onClick={openLogin}
              style={{
                background: 'transparent',
                color: '#e7e9ea',
                borderRadius: 999,
                padding: '14px 0',
                fontSize: 15,
                fontWeight: 700,
                border: '1px solid #3f3f46',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Log in
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#8b9099', marginTop: 20, maxWidth: 360 }}>
            By signing up you agree to our{' '}
            <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Terms</span>
            {' '}and{' '}
            <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>

        {/* Right column */}
        <div
          className="flex-1 flex items-center justify-center"
          style={{
            minHeight: '100vh',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.015)',
          }}
        >
          <div style={{ transform: 'scale(1.15)', transformOrigin: 'center center' }}>
            <PhoneMockup />
          </div>
        </div>
      </div>
    </main>
  );
}
