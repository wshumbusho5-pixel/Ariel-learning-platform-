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
    author: 'Naomi keza',
    avatar: 'N',
    avatarColor: '#7c5cfc',
    subject: 'Physics',
    subjectIcon: '🔬',
    time: '2d',
    caption: 'Most people get this wrong on the first try.',
    q: 'What is matter?',
    a: 'Anything that has mass and takes up space. Exists as solid, liquid, gas, or plasma.',
    likes: 6,
    comments: 2,
    reach: 646,
    saves: 1,
  },
  {
    type: 'reel',
    author: 'Orttoblend',
    avatar: 'O',
    avatarColor: '#52525b',
    subject: 'Sciences',
    title: 'cell division simplified',
    caption: 'Breaking it down so it actually makes sense',
    thumbGradient: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
    views: '2.3k',
    likes: 418,
  },
  {
    type: 'card',
    author: 'Uwase Monalisa',
    avatar: 'U',
    avatarColor: '#0ea5e9',
    subject: 'Sciences',
    subjectIcon: '🔭',
    time: '1d',
    caption: 'Failed this 3 times before it finally clicked 🤩',
    q: 'What is physics?',
    a: 'The natural science studying matter, motion, energy, and force — the foundation of all sciences.',
    likes: 3,
    comments: 5,
    reach: 275,
    saves: 2,
  },
  {
    type: 'reel',
    author: 'Ortega willy',
    avatar: 'O',
    avatarColor: '#f59e0b',
    subject: 'Economics',
    title: 'Supply & Demand in 60 sec',
    caption: 'The concept that runs the world',
    thumbGradient: 'linear-gradient(160deg, #1c1007 0%, #2d1b00 50%, #451a00 100%)',
    views: '5.1k',
    likes: 892,
  },
  {
    type: 'card',
    author: 'hui',
    avatar: 'H',
    avatarColor: '#7c5cfc',
    subject: 'History',
    subjectIcon: '📜',
    time: '3h',
    caption: 'This changed everything in modern history.',
    q: 'Who was Napoleon Bonaparte?',
    a: 'French military leader who rose to power after the Revolution and became Emperor of France.',
    likes: 12,
    comments: 8,
    reach: 1240,
    saves: 5,
  },
  {
    type: 'reel',
    author: 'Prof. James',
    avatar: 'P',
    avatarColor: '#22c55e',
    subject: 'Biology',
    title: 'How DNA replication works',
    caption: 'The most beautiful process in nature',
    thumbGradient: 'linear-gradient(160deg, #052e16 0%, #064e3b 60%, #065f46 100%)',
    views: '4.1k',
    likes: 847,
  },
] as const;

type FeedItem = typeof FEED_ITEMS[number];
type CardItem = Extract<FeedItem, { type: 'card' }>;
type ReelItem = Extract<FeedItem, { type: 'reel' }>;

// ─── Micro icons ──────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill={filled ? '#f43f5e' : 'none'} stroke={filled ? '#f43f5e' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5s-6-3.8-6-7.5a4 4 0 0 1 6-3.4A4 4 0 0 1 14 6c0 3.7-6 7.5-6 7.5z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h12v8H9l-3 3v-3H2z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="white">
      <path d="M5.5 3.5l8 4.5-8 4.5V3.5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5l3 3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10V7a5 5 0 0 1 10 0v3l1.5 2.5H1.5L3 10z" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

// ─── Card feed item ───────────────────────────────────────────────────────────

function CardFeedItem({ item, flipped }: { item: CardItem; flipped: boolean }) {
  return (
    <div style={{ padding: '10px 12px 0' }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: item.avatarColor, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff',
        }}>
          {item.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e7e9ea' }}>{item.author}</span>
            <span style={{
              fontSize: 9, color: '#8b9099',
              background: 'rgba(255,255,255,0.06)',
              padding: '1px 5px', borderRadius: 999,
            }}>{item.subject}</span>
            <span style={{ fontSize: 9, color: '#52525b', marginLeft: 'auto' }}>{item.time}</span>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p style={{ fontSize: 10.5, color: '#a1a1aa', marginBottom: 7, lineHeight: 1.35 }}>
        {item.caption}
      </p>

      {/* Flashcard */}
      <div style={{
        background: flipped ? '#f0fdf4' : '#fff',
        borderRadius: 10,
        border: `1px solid ${flipped ? '#bbf7d0' : 'rgba(0,0,0,0.08)'}`,
        padding: '9px 10px 8px 10px',
        minHeight: 72,
        boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
        transition: 'background 0.4s, border-color 0.4s',
        position: 'relative',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{
            fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em',
            color: flipped ? '#16a34a' : '#22c55e',
          }}>
            {flipped ? 'ANSWER' : 'QUESTION'}
          </span>
          <span style={{ fontSize: 9, color: '#a1a1aa' }}>{item.subjectIcon} {item.subject}</span>
        </div>
        {/* Divider */}
        <div style={{ height: 1, background: flipped ? '#bbf7d0' : 'rgba(0,0,0,0.07)', marginBottom: 6 }} />

        {/* Content */}
        <div style={{ position: 'relative', minHeight: 30 }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: '#18181b',
            lineHeight: 1.3,
            opacity: flipped ? 0 : 1,
            transition: 'opacity 0.3s',
            position: flipped ? 'absolute' : 'relative',
          }}>
            {item.q}
          </p>
          <p style={{
            fontSize: 10.5, color: '#3f3f46',
            lineHeight: 1.45,
            opacity: flipped ? 1 : 0,
            transition: 'opacity 0.3s',
            position: flipped ? 'relative' : 'absolute',
          }}>
            {item.a}
          </p>
        </div>

        {/* Bottom hint */}
        {!flipped && (
          <p style={{ fontSize: 8.5, color: '#d4d4d8', textAlign: 'right', marginTop: 5 }}>
            tap to reveal →
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginTop: 7, paddingBottom: 2, color: '#71717a',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5 }}>
          <HeartIcon filled={flipped} />{item.likes}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5 }}>
          <CommentIcon />{item.comments}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5, marginLeft: 'auto' }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h10v13l-5-3-5 3V2z" fill={flipped ? '#7c5cfc' : 'none'} stroke={flipped ? '#7c5cfc' : 'currentColor'} /></svg>
          {item.saves}
        </span>
      </div>
    </div>
  );
}

// ─── Reel feed item ───────────────────────────────────────────────────────────

function ReelFeedItem({ item }: { item: ReelItem }) {
  return (
    <div style={{ padding: '10px 12px 0' }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: item.avatarColor, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff',
        }}>
          {item.avatar}
        </div>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#e7e9ea' }}>{item.author}</span>
          <span style={{
            fontSize: 9, color: '#8b9099',
            background: 'rgba(255,255,255,0.06)',
            padding: '1px 5px', borderRadius: 999, marginLeft: 5,
          }}>{item.subject}</span>
        </div>
      </div>

      {/* Caption */}
      <p style={{ fontSize: 10.5, color: '#a1a1aa', marginBottom: 7 }}>
        {item.caption}
      </p>

      {/* Video thumbnail */}
      <div style={{
        borderRadius: 10, height: 124,
        background: item.thumbGradient,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subject pill */}
        <div style={{
          position: 'absolute', top: 7, left: 7,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          borderRadius: 999, fontSize: 8.5, color: '#fff',
          padding: '2px 7px',
        }}>
          {item.subject}
        </div>
        {/* Play button */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 36, height: 36,
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(6px)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <PlayIcon />
          </div>
        </div>
        {/* Title overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '16px 8px 8px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
        }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: '#fff' }}>{item.title}</p>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{item.views} views</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginTop: 7, color: '#71717a',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5 }}>
          <HeartIcon />{item.likes >= 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5 }}>
          <CommentIcon />
        </span>
      </div>
    </div>
  );
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (flipTimer.current) clearTimeout(flipTimer.current);
    if (advanceTimer.current) clearInterval(advanceTimer.current);
  };

  useEffect(() => {
    clearTimers();
    setFlipped(false);

    const item = FEED_ITEMS[activeIndex];
    if (item.type === 'card') {
      flipTimer.current = setTimeout(() => setFlipped(true), 1800);
    }

    advanceTimer.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveIndex(i => (i + 1) % FEED_ITEMS.length);
        setVisible(true);
      }, 350);
    }, 3500);

    return clearTimers;
  }, [activeIndex]);

  const item = FEED_ITEMS[activeIndex];

  return (
    <div style={{
      width: 240,
      height: 490,
      borderRadius: 34,
      border: '1.5px solid rgba(255,255,255,0.14)',
      background: '#000',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 32px 80px rgba(124,92,252,0.15), 0 8px 32px rgba(0,0,0,0.6)',
    }}>
      {/* ── Status bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px 4px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, color: '#71717a', fontWeight: 600 }}>9:41</span>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {[3,4,4,4].map((h, i) => (
            <div key={i} style={{ width: 2.5, height: h, background: i < 3 ? '#71717a' : '#3f3f46', borderRadius: 1 }} />
          ))}
          <div style={{ width: 12, height: 6, border: '1px solid #52525b', borderRadius: 2, marginLeft: 2, display: 'flex', alignItems: 'center', padding: '0 1px', gap: '1px' }}>
            <div style={{ flex: 1, height: 3, background: '#71717a', borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 12px 6px',
        flexShrink: 0,
      }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: '#7c5cfc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff',
            border: '1.5px solid #7c5cfc',
          }}>O</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Ortega</span>
        </div>
        {/* Wordmark */}
        <span style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: 'italic', fontWeight: 700,
          fontSize: 14, color: '#fff', letterSpacing: '0.02em',
        }}>
          ar<span style={{ color: '#7c5cfc' }}>i</span>el
        </span>
        {/* Icons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SearchIcon />
          <BellIcon />
        </div>
      </div>

      {/* ── Subject pills ── */}
      <div style={{
        display: 'flex', gap: 5, padding: '2px 12px 6px',
        flexShrink: 0, overflowX: 'hidden',
      }}>
        {[
          { label: 'All', active: true },
          { label: 'Physics' },
          { label: 'Economics' },
          { label: 'History' },
        ].map(pill => (
          <div key={pill.label} style={{
            padding: '3px 8px',
            borderRadius: 999,
            fontSize: 8.5,
            fontWeight: 600,
            flexShrink: 0,
            background: pill.active ? '#7c5cfc' : 'rgba(255,255,255,0.08)',
            color: pill.active ? '#fff' : '#8b9099',
            border: pill.active ? 'none' : '1px solid rgba(255,255,255,0.1)',
          }}>
            {pill.label}
          </div>
        ))}
      </div>

      {/* ── Feed tabs ── */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
        marginBottom: 2,
      }}>
        {['For You', 'Following', 'Explore'].map((tab, i) => (
          <div key={tab} style={{
            flex: 1, textAlign: 'center',
            padding: '6px 0 5px',
            fontSize: 9.5,
            fontWeight: i === 0 ? 700 : 500,
            color: i === 0 ? '#e7e9ea' : '#52525b',
            borderBottom: i === 0 ? '1.5px solid #7c5cfc' : '1.5px solid transparent',
            marginBottom: -1,
          }}>
            {tab}
          </div>
        ))}
      </div>

      {/* ── Feed item ── */}
      <div style={{
        flex: 1, overflow: 'hidden',
        transition: 'opacity 0.35s, transform 0.35s',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}>
        {item.type === 'card' ? (
          <CardFeedItem item={item as CardItem} flipped={flipped} />
        ) : (
          <ReelFeedItem item={item as ReelItem} />
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 0 10px',
        background: '#000',
        flexShrink: 0,
      }}>
        {/* Deck */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 9h18" />
        </svg>
        {/* Cards */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 10h16M4 14h10" />
        </svg>
        {/* AI button — purple pill */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c5cfc, #9b7fff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px rgba(124,92,252,0.5)',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />
        </div>
        {/* X */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
        {/* Lightning */}
        <svg width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L4 14h8l-1 8 9-12h-8l1-8z" />
        </svg>
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
          <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.025em' }}>
            Go deeper.
          </h1>
          <p style={{ fontSize: 16, color: '#8b9099', marginTop: 10, lineHeight: 1.5 }}>
            Cards, clips &amp; community<br />for curious minds.
          </p>
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
              width: '100%', background: '#fff', color: '#000',
              borderRadius: 999, padding: '14px 0',
              fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'block',
            }}
          >
            Create account
          </button>
          <button
            onClick={openLogin}
            style={{
              width: '100%', background: 'transparent', color: '#e7e9ea',
              borderRadius: 999, padding: '14px 0',
              fontSize: 15, fontWeight: 700,
              border: '1px solid #3f3f46', cursor: 'pointer', display: 'block', marginTop: 12,
            }}
          >
            Log in
          </button>
          <p style={{ fontSize: 11, color: '#52525b', textAlign: 'center', marginTop: 16 }}>
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
        <div className="flex-1 flex flex-col justify-center" style={{ paddingLeft: 80, paddingRight: 60, maxWidth: 580 }}>
          <div style={{ marginBottom: 40 }}>
            <ArielWordmark size={52} variant="dark" showTagline={false} animate />
          </div>

          <h1 style={{
            fontSize: 58, fontWeight: 900, color: '#fff',
            lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: 16,
          }}>
            Go deeper.
          </h1>

          <p style={{ fontSize: 18, color: '#8b9099', marginBottom: 8, lineHeight: 1.6 }}>
            Cards, clips &amp; community for curious minds.<br />
            <span style={{ color: '#52525b', fontSize: 15 }}>Whether you&apos;re in school, building skills, or just love to learn.</span>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360, marginTop: 32 }}>
            <button
              onClick={openSignup}
              style={{
                background: '#fff', color: '#000', borderRadius: 999,
                padding: '14px 0', fontSize: 15, fontWeight: 700,
                border: 'none', cursor: 'pointer', width: '100%',
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
                background: 'transparent', color: '#e7e9ea', borderRadius: 999,
                padding: '14px 0', fontSize: 15, fontWeight: 700,
                border: '1px solid #3f3f46', cursor: 'pointer', width: '100%',
              }}
            >
              Log in
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#52525b', marginTop: 20, maxWidth: 360 }}>
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
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            background: 'radial-gradient(ellipse at center, rgba(124,92,252,0.06) 0%, transparent 70%)',
          }}
        >
          <div style={{ transform: 'scale(1.18)', transformOrigin: 'center center' }}>
            <PhoneMockup />
          </div>
        </div>
      </div>
    </main>
  );
}
