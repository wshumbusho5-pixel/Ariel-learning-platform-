'use client';

import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#09090b] lg:pl-[72px]">
      <SideNav />
      <div className="flex flex-col items-center justify-center min-h-screen pb-20 lg:pb-0 px-6">
        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
          {icon ?? (
            <svg className="w-9 h-9 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h1 className="text-white text-2xl font-black mb-2 text-center">{title}</h1>
        <p className="text-zinc-500 text-sm text-center max-w-xs mb-2">
          {description ?? 'This feature is under construction and will be available soon.'}
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full mt-1 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-violet-400 text-xs font-semibold">Coming soon</span>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition-colors border border-zinc-700"
        >
          Back to Dashboard
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
