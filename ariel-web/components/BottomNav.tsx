'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Exported so dashboard can render the full "more" drawer
export const drawerItems = [
  {
    name: 'Create Cards',
    path: '/create-cards',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    name: 'Cram',
    path: '/cram',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    name: 'Explore',
    path: '/explore',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    name: 'Rooms',
    path: '/messages',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.836 1.359 5.373 3.497 7.07L4.5 22l4.193-1.668A10.7 10.7 0 0012 20.486c5.523 0 10-4.144 10-9.243S17.523 2 12 2z" />
      </svg>
    ),
  },
  {
    name: 'Clips',
    path: '/reels',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Live',
    path: '/live',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 10v4m0 0l-2-2m2 2l2-2M8.464 8.464a5 5 0 000 7.072M4.929 4.929a10 10 0 000 14.142M19.071 4.929a10 10 0 010 14.142" />
      </svg>
    ),
  },
  {
    name: 'Leaderboard',
    path: '/leaderboard',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Achievements',
    path: '/achievements',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    name: 'Feed',
    path: '/feed',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
];

// ─── Main nav tabs ─────────────────────────────────────────────────────────────

const TABS = [
  {
    name: 'Deck',
    path: '/deck',
    exact: false,
    icon: (active: boolean) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    name: 'Feed',
    path: '/dashboard',
    exact: true,
    icon: (active: boolean) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  // center slot — handled separately
  {
    name: 'Duels',
    path: '/duels',
    exact: false,
    icon: (active: boolean) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    name: 'Profile',
    path: '/profile',
    exact: false,
    icon: (active: boolean) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    import('@/lib/api').then(({ messagesAPI }) => {
      messagesAPI.getUnreadCount()
        .then((d: { unread_count?: number }) => setUnreadMessages(d?.unread_count ?? 0))
        .catch(() => {});
    });
  }, []);

  const isActive = (path: string, exact: boolean) =>
    exact ? pathname === path : pathname === path || pathname?.startsWith(path + '/');

  const isCreateActive = pathname === '/create-cards';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{ background: '#000', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-end h-[64px] max-w-screen-sm mx-auto px-1 pb-2">

        {/* Feed */}
        <TabButton
          label="Feed"
          active={isActive('/dashboard', true)}
          onClick={() => router.push('/dashboard')}
        >
          {TABS[1].icon(isActive('/dashboard', true))}
        </TabButton>

        {/* Deck */}
        <TabButton
          label="Deck"
          active={isActive('/deck', false)}
          onClick={() => router.push('/deck')}
        >
          {TABS[0].icon(isActive('/deck', false))}
        </TabButton>

        {/* Create — center FAB */}
        <button
          onClick={() => router.push('/create-cards')}
          className="flex-1 flex flex-col items-center pb-0.5"
          style={{ gap: 3 }}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center -mt-5 transition-transform duration-150 active:scale-95 ${
            isCreateActive
              ? 'bg-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.55)]'
              : 'bg-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.4)]'
          }`}>
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-[10px] font-medium" style={{ color: isCreateActive ? '#a78bfa' : 'rgba(255,255,255,0.35)' }}>
            Create
          </span>
        </button>

        {/* Duels */}
        <TabButton
          label="Duels"
          active={isActive('/duels', false)}
          onClick={() => router.push('/duels')}
        >
          {TABS[2].icon(isActive('/duels', false))}
        </TabButton>

        {/* Profile */}
        <TabButton
          label="Profile"
          active={isActive('/profile', false)}
          onClick={() => router.push('/profile')}
          badge={unreadMessages > 0 ? unreadMessages : undefined}
        >
          {TABS[3].icon(isActive('/profile', false))}
        </TabButton>

      </div>
    </div>
  );
}

// ─── Shared tab button ─────────────────────────────────────────────────────────

function TabButton({
  label,
  active,
  onClick,
  badge,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-end pb-0.5 transition-colors"
      style={{ gap: 3 }}
    >
      <div className="relative">
        <span style={{ color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
          {children}
        </span>
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] bg-violet-500 rounded-full flex items-center justify-center px-0.5">
            <span className="text-[9px] font-black text-white leading-none">{badge > 9 ? '9+' : badge}</span>
          </span>
        )}
      </div>
      <span
        className="text-[10px] font-medium leading-none"
        style={{ color: active ? '#a78bfa' : 'rgba(255,255,255,0.35)' }}
      >
        {label}
      </span>
    </button>
  );
}
