'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ArielIcon from '@/components/ArielIcon';
import ArielWordmark from '@/components/ArielWordmark';

const mainNav = [
  {
    name: 'Today',
    path: '/dashboard',
    exact: true,
    icon: (active: boolean) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Deck',
    path: '/deck',
    exact: false,
    icon: (active: boolean) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    name: 'Duels',
    path: '/duels',
    exact: false,
    icon: (active: boolean) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7-3 3M9.879 9.879L5 5l3 3M5 19l5-5M19 5l-5 5" />
      </svg>
    ),
  },
  {
    name: 'Cram',
    path: '/cram',
    exact: false,
    icon: (active: boolean) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

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
    name: 'Duels',
    path: '/duels',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    name: 'Rooms',
    path: '/messages',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Drawer — still accessible programmatically */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#0c0c0e] border-t border-zinc-800/60 rounded-t-3xl pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center pt-3 pb-5 gap-3">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
              <ArielWordmark size={38} variant="dark" showTagline />
            </div>
            <div className="grid grid-cols-4 gap-1 px-4">
              {drawerItems.map((item) => {
                const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                return (
                  <button
                    key={item.name}
                    onClick={() => { router.push(item.path); setDrawerOpen(false); }}
                    className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors ${
                      isActive ? 'bg-violet-500/15 text-violet-400' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                    }`}
                  >
                    {item.icon}
                    <span className="text-[11px] font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#09090b] border-t border-zinc-900">
        <div className="flex items-stretch h-[60px] max-w-screen-sm mx-auto">

          {/* Today, Deck */}
          {mainNav.slice(0, 2).map((item) => {
            const isActive = item.exact
              ? pathname === item.path
              : pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-1 transition-all"
              >
                <div className="flex flex-col items-center gap-0.5 px-3 py-1.5">
                  <span className={`transition-colors duration-200 ${isActive ? 'text-violet-400' : 'text-zinc-400'}`}>
                    {item.icon(isActive)}
                  </span>
                  <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive ? 'text-violet-400' : 'text-zinc-400'}`}>
                    {item.name}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Create — hero center button with Ariel icon */}
          <button
            onClick={() => router.push('/create-cards')}
            className="flex-1 flex flex-col items-center justify-center pb-1"
          >
            <div className="relative">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg -mt-5 border transition-transform duration-150 active:scale-95 ${
                pathname === '/create-cards'
                  ? 'bg-violet-400 border-violet-300/30 shadow-violet-400/30'
                  : 'bg-violet-500 border-violet-400/30 shadow-violet-500/30'
              }`}>
                <ArielIcon size={30} variant="purple" />
              </div>
            </div>
          </button>

          {/* Cram, Duels */}
          {mainNav.slice(2).map((item) => {
            const isActive = item.exact
              ? pathname === item.path
              : pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-1 transition-all"
              >
                <div className="flex flex-col items-center gap-0.5 px-3 py-1.5">
                  <span className={`transition-colors duration-200 ${isActive ? 'text-violet-400' : 'text-zinc-400'}`}>
                    {item.icon(isActive)}
                  </span>
                  <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive ? 'text-violet-400' : 'text-zinc-400'}`}>
                    {item.name}
                  </span>
                </div>
              </button>
            );
          })}

        </div>
      </div>
    </>
  );
}
