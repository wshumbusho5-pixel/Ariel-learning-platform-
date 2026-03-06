'use client';

import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  {
    name: 'Today',
    path: '/dashboard',
    exact: true,
    icon: (active: boolean) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Deck',
    path: '/deck',
    exact: false,
    icon: (active: boolean) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  { name: 'create', path: '/create-cards', exact: false, icon: () => null },
  {
    name: 'Explore',
    path: '/explore',
    exact: false,
    icon: (active: boolean) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    name: 'You',
    path: '/profile',
    exact: false,
    icon: (active: boolean) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-zinc-950 border-t border-zinc-800">
      <div className="flex items-stretch h-16 max-w-screen-sm mx-auto">
        {navItems.map((item) => {
          if (item.name === 'create') {
            return (
              <button
                key="create"
                onClick={() => router.push('/create-cards')}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
            );
          }

          const isActive = item.exact
            ? pathname === item.path
            : pathname === item.path || pathname?.startsWith(item.path + '/') || (item.path === '/explore' && (pathname?.startsWith('/reels') || pathname?.startsWith('/live') || pathname?.startsWith('/feed')));

          return (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-emerald-500' : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              {item.icon(isActive)}
              <span className="text-[10px] font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
