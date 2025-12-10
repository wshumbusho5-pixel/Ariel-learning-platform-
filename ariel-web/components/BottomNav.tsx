'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      name: 'Home',
      path: '/dashboard',
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? 'fill-current' : 'fill-none stroke-current'}`}
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: 'Explore',
      path: '/explore',
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? 'fill-current' : 'fill-none stroke-current'}`}
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      name: 'Review',
      path: '/review',
      icon: (active: boolean) => (
        <svg
          className="w-7 h-7"
          fill="white"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
        </svg>
      ),
      special: true,
    },
    {
      name: 'Feed',
      path: '/feed',
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? 'fill-current' : 'fill-none stroke-current'}`}
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      name: 'You',
      path: '/profile',
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? 'fill-current' : 'fill-none stroke-current'}`}
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-2xl border-t border-gray-200/50"></div>

      <div className="relative max-w-screen-xl mx-auto px-2">
        <div className="flex items-center justify-around h-20">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname?.startsWith(item.path));

            if (item.special) {
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className="flex flex-col items-center justify-center group -mt-8 magnetic-btn"
                >
                  <div className="relative">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 blur-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>

                    {/* Main button */}
                    <div className="relative w-16 h-16 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all">
                      {item.icon(true)}
                    </div>

                    {/* Active indicator dot */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-lg"></div>
                    )}
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-[68px] group transition-all ${
                  isActive ? 'text-purple-600' : 'text-gray-500'
                }`}
              >
                <div className={`relative transition-all ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {/* Icon background glow when active */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg opacity-30"></div>
                  )}

                  {/* Icon container */}
                  <div className={`relative ${isActive ? 'p-2' : ''}`}>
                    {item.icon(isActive)}
                  </div>
                </div>

                {/* Label */}
                <span
                  className={`text-xs mt-1 font-semibold transition-all ${
                    isActive
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
