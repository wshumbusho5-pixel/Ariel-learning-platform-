'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAriel } from '@/lib/arielContext';
import { useAuth } from '@/lib/useAuth';

type NavItem = {
  name: string;
  path: string;
  exact?: boolean;
  icon: (active: boolean) => JSX.Element;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const coreItems: NavItem[] = [
  {
    name: 'Today',
    path: '/dashboard',
    exact: true,
    icon: (active) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'My Deck',
    path: '/deck',
    icon: (active) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    name: 'Create',
    path: '/create-cards',
    icon: (active) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    name: 'Review',
    path: '/review',
    icon: (active) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

const expandedGroups: NavGroup[] = [
  {
    label: 'Learn',
    items: [
      {
        name: 'Explore',
        path: '/explore',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        ),
      },
      {
        name: 'Reels',
        path: '/reels',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        name: 'Live',
        path: '/live',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        ),
      },
      {
        name: 'Following',
        path: '/feed',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        name: 'Rooms',
        path: '/messages',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Study tools',
    items: [
      {
        name: 'Cram Mode',
        path: '/cram',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        name: 'Knowledge Map',
        path: '/map',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
          </svg>
        ),
      },
      {
        name: 'Brain Report',
        path: '/report',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Compete',
    items: [
      {
        name: 'Study Duels',
        path: '/duels',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        name: 'Challenges',
        path: '/challenges',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
      },
      {
        name: 'Leaderboard',
        path: '/leaderboard',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        name: 'Achievements',
        path: '/achievements',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        name: 'Notifications',
        path: '/notifications',
        icon: (active) => (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
      },
    ],
  },
];

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { openAriel } = useAriel();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.path;
    return pathname === item.path || pathname?.startsWith(item.path + '/');
  };

  const navigate = (path: string) => {
    router.push(path);
    setExpanded(false);
  };

  return (
    <>
      {/* Overlay when expanded */}
      {expanded && (
        <div
          className="hidden lg:block fixed inset-0 z-40"
          onClick={() => setExpanded(false)}
        />
      )}

      <div className={`hidden lg:flex fixed left-0 top-0 h-full flex-col z-50 bg-[#09090b] border-r border-zinc-800/60 transition-all duration-200 ${expanded ? 'w-56' : 'w-[72px]'}`}>
        {/* Logo + hamburger */}
        <div className={`flex items-center h-16 px-4 flex-shrink-0 ${expanded ? 'gap-3' : 'justify-center'}`}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {expanded && (
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">Ariel</span>
            </button>
          )}
        </div>

        {/* Core nav — always visible */}
        <nav className="flex flex-col px-2 gap-0.5">
          {coreItems.map((item) => {
            const active = isActive(item);
            const isCreate = item.path === '/create-cards';
            return (
              <button
                key={item.name}
                onClick={() => {
                  if (isCreate) { openAriel(); setExpanded(false); }
                  else navigate(item.path);
                }}
                title={!expanded ? item.name : undefined}
                className={`flex items-center rounded-xl transition-colors ${
                  expanded ? 'gap-3.5 px-3 py-2.5' : 'justify-center w-12 h-12 mx-auto'
                } ${
                  isCreate
                    ? 'bg-violet-400 hover:bg-violet-300 text-white'
                    : active
                    ? 'text-violet-300 bg-zinc-800/60'
                    : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
              >
                <span className={`flex-shrink-0 ${isCreate ? 'text-white' : active ? 'text-violet-300' : 'text-zinc-500'}`}>
                  {item.icon(active)}
                </span>
                {expanded && (
                  <span className="text-[14px] font-semibold truncate">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 my-3 border-t border-zinc-800" />

        {/* Expanded groups */}
        {expanded && (
          <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-5">
            {expandedGroups.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest px-3 mb-1.5">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item);
                    return (
                      <button
                        key={item.name}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                          active ? 'text-violet-300 bg-zinc-800/60' : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60'
                        }`}
                      >
                        <span className={`flex-shrink-0 ${active ? 'text-violet-300' : 'text-zinc-600'}`}>
                          {item.icon(active)}
                        </span>
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        )}

        {/* User avatar — always at bottom, taps to profile */}
        <div className={`mt-auto px-2 pb-4 flex-shrink-0 ${expanded ? '' : 'flex justify-center'}`}>
          <button
            onClick={() => navigate('/profile')}
            title={!expanded ? (user?.username || 'Profile') : undefined}
            className={`flex items-center gap-3 rounded-xl transition-colors hover:bg-zinc-800/60 ${
              expanded ? 'px-3 py-2 w-full' : 'w-12 h-12 justify-center'
            } ${pathname === '/profile' ? 'bg-zinc-800/60' : ''}`}
          >
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-zinc-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-violet-400 flex items-center justify-center flex-shrink-0 ring-2 ring-zinc-700">
                <span className="text-xs font-black text-white">
                  {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            {expanded && (
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-zinc-300 truncate">{user?.full_name || user?.username || 'Profile'}</p>
                <p className="text-[11px] text-zinc-600 truncate">@{user?.username || '—'}</p>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
