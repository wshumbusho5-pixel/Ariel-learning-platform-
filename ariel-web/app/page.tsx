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
    author: 'Alex K.',
    avatar: 'A',
    avatarColor: '#7c5cfc',
    subject: 'Physics',
    subjectIcon: '🔬',
    time: '2d',
    caption: 'Most people get this wrong on the first try.',
    q: 'What is matter?',
    a: 'Anything that has mass and takes up space. Exists as solid, liquid, gas, or plasma.',
    likes: 6, comments: 2, reach: 646, saves: 1,
  },
  {
    type: 'reel',
    author: 'Jordan M.',
    avatar: 'J',
    avatarColor: '#0ea5e9',
    subject: 'Sciences',
    title: 'Cell division simplified',
    caption: 'Breaking it down so it actually makes sense',
    thumbImg: 'https://i.pravatar.cc/400?img=47',
    views: '2.3k',
    likes: 418,
  },
  {
    type: 'card',
    author: 'Sam R.',
    avatar: 'S',
    avatarColor: '#22c55e',
    subject: 'Sciences',
    subjectIcon: '🔭',
    time: '1d',
    caption: 'Failed this 3 times before it finally clicked 🤩',
    q: 'What is physics?',
    a: 'The natural science studying matter, motion, energy, and force — the foundation of all sciences.',
    likes: 3, comments: 5, reach: 275, saves: 2,
  },
  {
    type: 'reel',
    author: 'Casey T.',
    avatar: 'C',
    avatarColor: '#f59e0b',
    subject: 'Economics',
    title: 'Supply & Demand in 60 sec',
    caption: 'The concept that runs the world',
    thumbImg: 'https://i.pravatar.cc/400?img=12',
    views: '5.1k',
    likes: 892,
  },
  {
    type: 'card',
    author: 'Taylor B.',
    avatar: 'T',
    avatarColor: '#f43f5e',
    subject: 'History',
    subjectIcon: '📜',
    time: '3h',
    caption: 'This changed everything in modern history.',
    q: 'Who was Napoleon Bonaparte?',
    a: 'French military leader who rose to power after the Revolution and became Emperor of France.',
    likes: 12, comments: 8, reach: 1240, saves: 5,
  },
  {
    type: 'reel',
    author: 'Morgan L.',
    avatar: 'M',
    avatarColor: '#8b5cf6',
    subject: 'Biology',
    title: 'How DNA replication works',
    caption: 'The most beautiful process in nature',
    thumbImg: 'https://i.pravatar.cc/400?img=26',
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
    <svg width="12" height="12" viewBox="0 0 16 16"
      fill={filled ? '#f43f5e' : 'none'} stroke={filled ? '#f43f5e' : 'currentColor'}
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5s-6-3.8-6-7.5a4 4 0 0 1 6-3.4A4 4 0 0 1 14 6c0 3.7-6 7.5-6 7.5z" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h12v8H9l-3 3v-3H2z" />
    </svg>
  );
}
function PlayIcon() {
  return <svg width="18" height="18" viewBox="0 0 16 16" fill="white"><path d="M5.5 3.5l8 4.5-8 4.5V3.5z" /></svg>;
}
function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5l3 3" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10V7a5 5 0 0 1 10 0v3l1.5 2.5H1.5L3 10z" /><path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

// ─── Card feed item ───────────────────────────────────────────────────────────

function CardFeedItem({ item, flipped }: { item: CardItem; flipped: boolean }) {
  return (
    <div style={{ padding: '10px 12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: item.avatarColor, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
          {item.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#e7e9ea' }}>{item.author}</span>
          <span style={{ fontSize: 9, color: '#8b9099', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 999 }}>{item.subject}</span>
          <span style={{ fontSize: 9, color: '#52525b', marginLeft: 'auto' }}>{item.time}</span>
        </div>
      </div>

      <p style={{ fontSize: 10.5, color: '#a1a1aa', marginBottom: 7, lineHeight: 1.35 }}>{item.caption}</p>

      <div style={{
        background: flipped ? '#f0fdf4' : '#fff',
        borderRadius: 10, border: `1px solid ${flipped ? '#bbf7d0' : 'rgba(0,0,0,0.08)'}`,
        padding: '9px 10px 8px', minHeight: 74,
        boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
        transition: 'background 0.4s, border-color 0.4s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', color: flipped ? '#16a34a' : '#22c55e' }}>
            {flipped ? 'ANSWER' : 'QUESTION'}
          </span>
          <span style={{ fontSize: 9, color: '#a1a1aa' }}>{item.subjectIcon} {item.subject}</span>
        </div>
        <div style={{ height: 1, background: flipped ? '#bbf7d0' : 'rgba(0,0,0,0.07)', marginBottom: 6 }} />
        <div style={{ position: 'relative', minHeight: 28 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#18181b', lineHeight: 1.3, opacity: flipped ? 0 : 1, transition: 'opacity 0.3s', position: flipped ? 'absolute' : 'relative' }}>
            {item.q}
          </p>
          <p style={{ fontSize: 10.5, color: '#3f3f46', lineHeight: 1.45, opacity: flipped ? 1 : 0, transition: 'opacity 0.3s', position: flipped ? 'relative' : 'absolute' }}>
            {item.a}
          </p>
        </div>
        {!flipped && <p style={{ fontSize: 8.5, color: '#d4d4d8', textAlign: 'right', marginTop: 5 }}>tap to reveal →</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 7, color: '#71717a' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5 }}><HeartIcon filled={flipped} />{item.likes}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5 }}><CommentIcon />{item.comments}</span>
        <span style={{ fontSize: 9, color: '#444', marginLeft: 'auto' }}>{item.reach}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9.5 }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill={flipped ? '#7c5cfc' : 'none'} stroke={flipped ? '#7c5cfc' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h10v13l-5-3-5 3V2z" /></svg>
          {item.saves}
        </span>
      </div>
    </div>
  );
}

// ─── Reel feed item ───────────────────────────────────────────────────────────

function ReelFeedItem({ item }: { item: ReelItem }) {
  return (
    <div style={{ padding: '8px 12px 0' }}>
      {/* Portrait TikTok-style thumbnail — fills the width, taller than wide */}
      <div style={{
        borderRadius: 12,
        // 9:16 feel inside the phone — wide content area ~248px → height ~340px is too tall,
        // so we use a 3:4 crop (248 × 210) which reads as portrait and fits the card
        width: '100%',
        height: 210,
        position: 'relative',
        overflow: 'hidden',
        background: '#111',
      }}>
        {/* Real face photo */}
        <img
          src={item.thumbImg}
          alt={item.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />

        {/* Gradient scrim — heavier at top and bottom like TikTok */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.85) 100%)' }} />

        {/* Subject pill — top left */}
        <div style={{
          position: 'absolute', top: 9, left: 9,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          borderRadius: 999, fontSize: 8.5, color: '#fff',
          padding: '2px 8px', border: '1px solid rgba(255,255,255,0.15)',
          fontWeight: 600,
        }}>
          {item.subject}
        </div>

        {/* Play button — centre */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid rgba(255,255,255,0.35)',
          }}>
            <PlayIcon />
          </div>
        </div>

        {/* Author row + title — bottom overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 10px 10px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 5, lineHeight: 1.3 }}>{item.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: item.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)' }}>
                {item.avatar}
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>@{item.author.replace(' ', '').toLowerCase()}</span>
            </div>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}>{item.views} views</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 8, color: '#71717a' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5 }}>
          <HeartIcon />{item.likes >= 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5 }}><CommentIcon /></span>
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
    if (item.type === 'card') flipTimer.current = setTimeout(() => setFlipped(true), 1800);
    advanceTimer.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setActiveIndex(i => (i + 1) % FEED_ITEMS.length); setVisible(true); }, 350);
    }, 3800);
    return clearTimers;
  }, [activeIndex]);

  const item = FEED_ITEMS[activeIndex];

  return (
    <div style={{
      width: 272, height: 540, borderRadius: 38,
      border: '1.5px solid rgba(255,255,255,0.13)',
      background: '#000', overflow: 'hidden', flexShrink: 0,
      position: 'relative', display: 'flex', flexDirection: 'column',
      boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
    }}>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 4px', flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: '#71717a', fontWeight: 600 }}>9:41</span>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
          {[3, 4, 5, 5].map((h, i) => (
            <div key={i} style={{ width: 2.5, height: h, background: i < 3 ? '#8b9099' : '#3f3f46', borderRadius: 1 }} />
          ))}
          <div style={{ width: 14, height: 7, border: '1px solid #52525b', borderRadius: 2, marginLeft: 3, display: 'flex', alignItems: 'center', padding: '0 1.5px' }}>
            <div style={{ flex: 0.7, height: 3.5, background: '#8b9099', borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 14px 6px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#7c5cfc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>Y</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>You</span>
        </div>
        <span style={{ fontFamily: "Georgia,'Times New Roman',serif", fontStyle: 'italic', fontWeight: 700, fontSize: 15, color: '#fff' }}>
          ar<span style={{ color: '#7c5cfc' }}>i</span>el
        </span>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}><SearchIcon /><BellIcon /></div>
      </div>

      {/* Subject pills */}
      <div style={{ display: 'flex', gap: 5, padding: '2px 14px 7px', flexShrink: 0, overflowX: 'hidden' }}>
        {[{ label: 'All', active: true }, { label: 'Physics' }, { label: 'Economics' }, { label: 'History' }].map(pill => (
          <div key={pill.label} style={{
            padding: '3px 9px', borderRadius: 999, fontSize: 9, fontWeight: 600, flexShrink: 0,
            background: pill.active ? '#7c5cfc' : 'rgba(255,255,255,0.07)',
            color: pill.active ? '#fff' : '#8b9099',
            border: pill.active ? 'none' : '1px solid rgba(255,255,255,0.09)',
          }}>{pill.label}</div>
        ))}
      </div>

      {/* Feed tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, marginBottom: 2 }}>
        {['For You', 'Following', 'Explore'].map((tab, i) => (
          <div key={tab} style={{
            flex: 1, textAlign: 'center', padding: '6px 0 5px',
            fontSize: 10, fontWeight: i === 0 ? 700 : 500,
            color: i === 0 ? '#e7e9ea' : '#52525b',
            borderBottom: i === 0 ? '1.5px solid #7c5cfc' : '1.5px solid transparent',
            marginBottom: -1,
          }}>{tab}</div>
        ))}
      </div>

      {/* Feed item */}
      <div style={{ flex: 1, overflow: 'hidden', transition: 'opacity 0.3s', opacity: visible ? 1 : 0 }}>
        {item.type === 'card'
          ? <CardFeedItem item={item as CardItem} flipped={flipped} />
          : <ReelFeedItem item={item as ReelItem} />
        }
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, paddingBottom: 10, paddingTop: 4, flexShrink: 0 }}>
        {FEED_ITEMS.map((_, i) => (
          <div key={i} style={{ width: i === activeIndex ? 14 : 4, height: 4, borderRadius: 999, background: i === activeIndex ? '#7c5cfc' : 'rgba(255,255,255,0.12)', transition: 'all 0.3s' }} />
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 0 12px', background: '#000', flexShrink: 0 }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18" /></svg>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 10h16M4 14h10" /></svg>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #7c5cfc, #9b7fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,92,252,0.6)' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.92)' }} />
        </div>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        <svg width="17" height="19" viewBox="0 0 24 24" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h8l-1 8 9-12h-8l1-8z" /></svg>
      </div>
    </div>
  );
}

// ─── Feature pills ─────────────────────────────────────────────────────────────

function FeaturePills() {
  const [hovered, setHovered] = useState<string | null>(null);
  const pills = [
    { icon: '⚡', label: 'Cram Mode',    desc: 'High-speed card review with spaced repetition' },
    { icon: '⚔️', label: 'Study Duels',  desc: 'Challenge friends to live knowledge battles' },
    { icon: '🎬', label: 'Short Clips',  desc: 'Learn from 60-second educational videos' },
    { icon: '🃏', label: 'Flashcards',   desc: 'Build and share decks on any topic' },
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
      {pills.map(f => (
        <div
          key={f.label}
          onMouseEnter={() => setHovered(f.label)}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: hovered === f.label ? '6px 14px 6px 12px' : '6px 14px',
            borderRadius: 999,
            background: hovered === f.label ? 'rgba(155,127,255,0.15)' : 'rgba(155,127,255,0.07)',
            border: `1px solid ${hovered === f.label ? 'rgba(155,127,255,0.4)' : 'rgba(155,127,255,0.18)'}`,
            fontSize: 12, color: hovered === f.label ? '#c4b5fd' : '#a78bfa', fontWeight: 600,
            letterSpacing: '0.01em',
            transition: 'all 0.18s ease',
            cursor: 'default',
            position: 'relative',
          }}
        >
          <span style={{ fontSize: 13 }}>{f.icon}</span>
          {f.label}
          {hovered === f.label && (
            <span style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(20,20,20,0.96)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '5px 10px', fontSize: 10.5, color: '#a1a1aa',
              whiteSpace: 'nowrap', pointerEvents: 'none', fontWeight: 400,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}>
              {f.desc}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, checkAuth } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => {
    if (isAuthenticated && !isLoading) router.push('/dashboard');
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
        onSuccess={(user, token) => { login(user, token); router.push('/dashboard'); }}
      />

      {/* ── Mobile ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-between h-screen px-6 lg:hidden" style={{ paddingTop: 28, paddingBottom: 24, position: 'relative', overflow: 'hidden' }}>

        {/* Background depth — radial glow behind the phone */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Wordmark */}
        <div className="flex justify-center" style={{ position: 'relative', zIndex: 1 }}>
          <ArielWordmark size={36} variant="dark" showTagline={false} animate />
        </div>

        {/* Phone — scaled down to fit */}
        <div className="flex justify-center" style={{ transform: 'scale(0.72)', transformOrigin: 'center center', margin: '-40px 0', position: 'relative', zIndex: 1 }}>
          <PhoneMockup />
        </div>

        {/* Bottom: headline + CTAs */}
        <div className="w-full" style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-center mb-6">
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: 0 }}>
              Go{' '}
              <span style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 38,
                color: '#9B7FFF',
                letterSpacing: '-0.01em',
              }}>deeper.</span>
            </h1>
            <p style={{ fontSize: 13, color: '#71717a', marginTop: 10, lineHeight: 1.6, maxWidth: 280, margin: '10px auto 0' }}>
              Real insight, not just content — built for cramming, growing, and staying curious.
            </p>
          </div>

          {/* Primary CTA — full weight */}
          <button
            onClick={openSignup}
            style={{ width: '100%', background: '#fff', color: '#000', borderRadius: 999, padding: '14px 0', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'block', letterSpacing: '-0.01em', transition: 'transform 0.1s, box-shadow 0.1s' }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            Create account
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: '#3f3f46', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Secondary CTA — lower visual weight */}
          <button
            onClick={openLogin}
            style={{ width: '100%', background: 'transparent', color: '#a1a1aa', borderRadius: 999, padding: '12px 0', fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'block', letterSpacing: '0.005em' }}
          >
            Log in
          </button>

          <p style={{ fontSize: 10, color: '#3f3f46', textAlign: 'center', marginTop: 12, letterSpacing: '0.01em' }}>
            By signing up you agree to our{' '}
            <span style={{ color: '#6d28d9', cursor: 'pointer' }}>Terms</span>
            {' & '}
            <span style={{ color: '#6d28d9', cursor: 'pointer' }}>Privacy</span>
          </p>
        </div>
      </div>

      {/* ── Desktop ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen items-center" style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Global background grain + glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 70% 80% at 65% 50%, rgba(124,92,252,0.09) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Subtle top-left accent */}
        <div style={{
          position: 'absolute', top: -120, left: -80, width: 480, height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Left — asymmetric: narrower column, content pushed slightly left-of-center */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '48%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          paddingLeft: 'max(64px, 7vw)', paddingRight: 48, paddingTop: 48, paddingBottom: 48,
        }}>
          <div style={{ marginBottom: 44, animation: 'fadeUp 0.6s ease both' }}>
            <ArielWordmark size={52} variant="dark" showTagline={false} animate />
          </div>

          <h1 style={{
            fontWeight: 900, color: '#fff', lineHeight: 0.96,
            letterSpacing: '-0.035em', marginBottom: 22,
            animation: 'fadeUp 0.6s 0.1s ease both',
          }}>
            <span style={{ fontSize: 'clamp(52px,5.5vw,72px)', display: 'block' }}>Go</span>
            <span style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(60px,6.5vw,84px)',
              color: '#9B7FFF',
              letterSpacing: '-0.02em',
              display: 'block', lineHeight: 0.95,
            }}>deeper.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px,1.4vw,18px)', color: '#8b9099', lineHeight: 1.65,
            maxWidth: 400, animation: 'fadeUp 0.6s 0.2s ease both',
          }}>
            A smarter feed that builds real understanding — not just information, but insight.
          </p>
          <p style={{
            fontSize: 13, color: '#52525b', marginTop: 8, maxWidth: 400, lineHeight: 1.6,
            animation: 'fadeUp 0.6s 0.25s ease both',
          }}>
            Cramming for an exam, growing your skills, or just staying curious — Ariel meets you exactly where you are.
          </p>

          <div style={{ animation: 'fadeUp 0.6s 0.3s ease both' }}>
            <FeaturePills />
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 12,
            maxWidth: 340, marginTop: 40,
            animation: 'fadeUp 0.6s 0.38s ease both',
          }}>
            <button
              onClick={openSignup}
              style={{
                background: '#fff', color: '#000', borderRadius: 999,
                padding: '15px 0', fontSize: 15, fontWeight: 800,
                border: 'none', cursor: 'pointer', width: '100%',
                letterSpacing: '-0.01em',
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                boxShadow: '0 0 0 rgba(255,255,255,0)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.025)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(255,255,255,0.12)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 rgba(255,255,255,0)';
              }}
            >
              Create account
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: 12, color: '#3f3f46', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <button
              onClick={openLogin}
              style={{
                background: 'transparent', color: '#a1a1aa', borderRadius: 999,
                padding: '14px 0', fontSize: 14, fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', width: '100%',
                transition: 'border-color 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.22)';
                (e.currentTarget as HTMLButtonElement).style.color = '#e7e9ea';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
                (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa';
              }}
            >
              Log in
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#3f3f46', marginTop: 18, maxWidth: 340, animation: 'fadeUp 0.6s 0.45s ease both' }}>
            By signing up you agree to our{' '}
            <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Terms</span>
            {' and '}
            <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>

        {/* Right — wider panel, phone floats with glow */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '52%', minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderLeft: '1px solid rgba(255,255,255,0.04)',
        }}>
          {/* Phone glow */}
          <div style={{
            position: 'absolute', width: 380, height: 380, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,92,252,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            transform: 'scale(1.22)', transformOrigin: 'center center',
            animation: 'phoneIn 0.8s 0.15s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <PhoneMockup />
          </div>
        </div>

        {/* Keyframe styles */}
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes phoneIn {
            from { opacity: 0; transform: scale(1.1) translateY(24px); }
            to   { opacity: 1; transform: scale(1.22) translateY(0); }
          }
        `}</style>

      </div>
    </main>
  );
}
