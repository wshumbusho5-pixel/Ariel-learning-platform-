'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: (active: boolean) => (
        <svg
          className={`w-7 h-7 ${active ? 'fill-current' : 'fill-none stroke-current'}`}
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
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
          className={`w-7 h-7 ${active ? 'fill-current' : 'fill-none stroke-current'}`}
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
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
          className={`w-7 h-7 ${active ? 'fill-current' : 'fill-none stroke-current'}`}
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      special: true,
    },
    {
      name: 'Deck',
      path: '/deck',
      icon: (active: boolean) => (
        <svg
          className={`w-7 h-7 ${active ? 'fill-current' : 'fill-none stroke-current'}`}
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      name: 'Profile',
      path: '/dashboard',
      icon: (active: boolean) => (
        <svg
          className={`w-7 h-7 ${active ? 'fill-current' : 'fill-none stroke-current'}`}
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div className="max-w-screen-xl mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.path;

            if (item.special) {
              // Special center button (like Instagram's post button)
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className="flex flex-col items-center justify-center group -mt-6"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    {item.icon(true)}
                    <span className="text-white">
                      {item.icon(true)}
                    </span>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-[60px] group ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <div className={`transition-all ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {item.icon(isActive)}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-600 group-hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
