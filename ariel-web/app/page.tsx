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
    thumb: 'sciences',
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
    thumb: 'economics',
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
    thumb: 'biology',
    views: '4.1k',
    likes: 847,
  },
] as const;

type FeedItem = typeof FEED_ITEMS[number];
type CardItem = Extract<FeedItem, { type: 'card' }>;
type ReelItem = Extract<FeedItem, { type: 'reel' }>;

// ─── Reel thumbnail art ───────────────────────────────────────────────────────

const THUMB_CONFIGS: Record<string, { bg: string; accent: string; art: React.ReactNode }> = {
  sciences: {
    bg: 'linear-gradient(145deg, #0c2a4a 0%, #0e4d6e 60%, #0891b2 100%)',
    accent: '#22d3ee',
    art: (
      <svg width="100%" height="100%" viewBox="0 0 280 140" fill="none" style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
        {/* Cell-like circles */}
        <circle cx="60"  cy="50"  r="38" stroke="#22d3ee" strokeWidth="1.5" />
        <circle cx="60"  cy="50"  r="16" stroke="#22d3ee" strokeWidth="1" />
        <circle cx="180" cy="90"  r="28" stroke="#22d3ee" strokeWidth="1.5" />
        <circle cx="180" cy="90"  r="10" stroke="#22d3ee" strokeWidth="1" />
        <circle cx="230" cy="30"  r="20" stroke="#22d3ee" strokeWidth="1" />
        <circle cx="110" cy="115" r="15" stroke="#22d3ee" strokeWidth="1" />
        {/* Dots */}
        <circle cx="60"  cy="50"  r="3" fill="#22d3ee" opacity="0.7" />
        <circle cx="180" cy="90"  r="3" fill="#22d3ee" opacity="0.7" />
        <circle cx="230" cy="30"  r="2" fill="#22d3ee" opacity="0.5" />
      </svg>
    ),
  },
  economics: {
    bg: 'linear-gradient(145deg, #1c0d00 0%, #7c2d12 60%, #9a3412 100%)',
    accent: '#fb923c',
    art: (
      <svg width="100%" height="100%" viewBox="0 0 280 140" fill="none" style={{ position: 'absolute', inset: 0, opacity: 0.28 }}>
        {/* Supply curve */}
        <path d="M20 120 Q80 90 140 60 Q200 30 260 15" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
        {/* Demand curve */}
        <path d="M20 15 Q80 45 140 70 Q200 95 260 120" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        {/* Intersection */}
        <circle cx="140" cy="67" r="5" fill="#fb923c" opacity="0.9" />
        {/* Grid */}
        {[40, 80, 120, 160, 200, 240].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="140" stroke="#fb923c" strokeWidth="0.4" opacity="0.3" />
        ))}
        {[30, 60, 90, 110].map(y => (
          <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="#fb923c" strokeWidth="0.4" opacity="0.3" />
        ))}
        {/* Labels */}
        <text x="30" y="30" fill="#fb923c" fontSize="11" opacity="0.8" fontWeight="600">Supply</text>
        <text x="30" y="112" fill="#fbbf24" fontSize="11" opacity="0.8" fontWeight="600">Demand</text>
      </svg>
    ),
  },
  biology: {
    bg: 'linear-gradient(145deg, #021a0e 0%, #064e3b 60%, #065f46 100%)',
    accent: '#34d399',
    art: (
      <svg width="100%" height="100%" viewBox="0 0 280 140" fill="none" style={{ position: 'absolute', inset: 0, opacity: 0.28 }}>
        {/* DNA double helix */}
        <path d="M60 10 C80 30 100 30 120 50 C140 70 160 70 180 90 C200 110 220 110 240 130" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
        <path d="M60 130 C80 110 100 110 120 90 C140 70 160 70 180 50 C200 30 220 30 240 10" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
        {/* Rungs */}
        {[
          [70, 22, 70, 118], [90, 34, 90, 106], [110, 48, 110, 92],
          [130, 62, 130, 78], [150, 70, 150, 70], [170, 62, 170, 78],
          [190, 50, 190, 90], [210, 36, 210, 104], [230, 22, 230, 118],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#34d399" strokeWidth="1" opacity="0.4" />
        ))}
        {/* Nucleotide dots */}
        {[70, 110, 150, 190, 230].map((x, i) => (
          <circle key={i} cx={x} cy={i % 2 === 0 ? 22 : 118} r="4" fill="#34d399" opacity="0.7" />
        ))}
      </svg>
    ),
  },
};

function ReelThumb({ thumb, children }: { thumb: string; children: React.ReactNode }) {
  const cfg = THUMB_CONFIGS[thumb] ?? THUMB_CONFIGS.sciences;
  return (
    <div style={{ borderRadius: 10, height: 128, position: 'relative', overflow: 'hidden', background: cfg.bg }}>
      {cfg.art}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />
      {children}
    </div>
  );
}

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
    <div style={{ padding: '10px 12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: item.avatarColor, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
          {item.avatar}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#e7e9ea' }}>{item.author}</span>
          <span style={{ fontSize: 9, color: '#8b9099', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 999 }}>{item.subject}</span>
        </div>
      </div>

      <p style={{ fontSize: 10.5, color: '#a1a1aa', marginBottom: 7 }}>{item.caption}</p>

      <ReelThumb thumb={item.thumb}>
        <div style={{ position: 'absolute', top: 7, left: 7, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', borderRadius: 999, fontSize: 8.5, color: '#fff', padding: '2px 7px', border: '1px solid rgba(255,255,255,0.12)' }}>
          {item.subject}
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
            <PlayIcon />
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: '#fff' }}>{item.title}</p>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{item.views} views</p>
        </div>
      </ReelThumb>

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 7, color: '#71717a' }}>
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
      boxShadow: '0 40px 100px rgba(124,92,252,0.20), 0 8px 40px rgba(0,0,0,0.7)',
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
      <div style={{ flex: 1, overflow: 'hidden', transition: 'opacity 0.35s, transform 0.35s', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)' }}>
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
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
      {[
        { icon: '⚡', label: 'Cram Mode' },
        { icon: '⚔️', label: 'Study Duels' },
        { icon: '🎬', label: 'Short Clips' },
        { icon: '🃏', label: 'Flashcards' },
      ].map(f => (
        <div key={f.label} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 13px', borderRadius: 999,
          background: 'rgba(124,92,252,0.08)',
          border: '1px solid rgba(124,92,252,0.2)',
          fontSize: 12, color: '#a78bfa', fontWeight: 500,
        }}>
          <span style={{ fontSize: 13 }}>{f.icon}</span>{f.label}
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
      <div className="flex flex-col items-center min-h-screen px-6 lg:hidden" style={{ paddingTop: 40, paddingBottom: 32 }}>

        {/* Wordmark */}
        <div className="flex justify-center mb-5">
          <ArielWordmark size={48} variant="dark" showTagline={false} animate />
        </div>

        {/* Phone first — let the product speak before any text */}
        <div className="flex justify-center mb-7">
          <PhoneMockup />
        </div>

        {/* Headline below phone */}
        <div className="text-center mb-8">
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.025em' }}>
            Go deeper.
          </h1>
          <p style={{ fontSize: 14, color: '#8b9099', marginTop: 10, lineHeight: 1.6 }}>
            Cards, clips &amp; community — for students, self-learners, and anyone endlessly curious.
          </p>
        </div>

        {/* CTAs */}
        <div className="w-full">
          <button onClick={openSignup} style={{ width: '100%', background: '#fff', color: '#000', borderRadius: 999, padding: '14px 0', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'block' }}>
            Create account
          </button>
          <button onClick={openLogin} style={{ width: '100%', background: 'transparent', color: '#e7e9ea', borderRadius: 999, padding: '14px 0', fontSize: 15, fontWeight: 700, border: '1px solid #3f3f46', cursor: 'pointer', display: 'block', marginTop: 10 }}>
            Log in
          </button>
          <p style={{ fontSize: 11, color: '#52525b', textAlign: 'center', marginTop: 14 }}>
            By signing up you agree to our <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Terms</span> and <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>
      </div>

      {/* ── Desktop ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen items-center">

        {/* Left */}
        <div className="flex-1 flex flex-col justify-center" style={{ paddingLeft: 80, paddingRight: 60, maxWidth: 580 }}>
          <div style={{ marginBottom: 40 }}>
            <ArielWordmark size={52} variant="dark" showTagline={false} animate />
          </div>

          <h1 style={{ fontSize: 58, fontWeight: 900, color: '#fff', lineHeight: 0.98, letterSpacing: '-0.03em', marginBottom: 18 }}>
            Go deeper.
          </h1>

          <p style={{ fontSize: 17, color: '#8b9099', lineHeight: 1.6, maxWidth: 420 }}>
            The social feed that makes you smarter.
          </p>
          <p style={{ fontSize: 14, color: '#52525b', marginTop: 6, maxWidth: 420 }}>
            Whether you&apos;re cramming for an exam, building new skills, or just endlessly curious — Ariel meets you where you are.
          </p>

          <FeaturePills />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360, marginTop: 36 }}>
            <button onClick={openSignup} style={{ background: '#fff', color: '#000', borderRadius: 999, padding: '14px 0', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', width: '100%' }}>
              Create account
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: 12, color: '#52525b' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <button onClick={openLogin} style={{ background: 'transparent', color: '#e7e9ea', borderRadius: 999, padding: '14px 0', fontSize: 15, fontWeight: 700, border: '1px solid #3f3f46', cursor: 'pointer', width: '100%' }}>
              Log in
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#52525b', marginTop: 20, maxWidth: 360 }}>
            By signing up you agree to our <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Terms</span> and <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>

        {/* Right */}
        <div className="flex-1 flex items-center justify-center" style={{
          minHeight: '100vh',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          background: 'radial-gradient(ellipse at 60% 50%, rgba(124,92,252,0.10) 0%, rgba(124,92,252,0.03) 40%, transparent 70%)',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.13) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ transform: 'scale(1.2)', transformOrigin: 'center center', position: 'relative' }}>
            <PhoneMockup />
          </div>
        </div>

      </div>
    </main>
  );
}
