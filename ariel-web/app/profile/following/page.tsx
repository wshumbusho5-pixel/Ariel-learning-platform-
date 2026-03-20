'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { socialAPI } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

interface Person {
  id: string;
  username?: string;
  full_name?: string;
  profile_picture?: string;
  bio?: string;
  is_following: boolean;
  is_teacher?: boolean;
  is_verified?: boolean;
}

function Avatar({ person }: { person: Person }) {
  const [broken, setBroken] = useState(false);
  if (person.profile_picture && !broken) {
    return (
      <img
        src={person.profile_picture.replace(/^https?:\/\/[^/]+/, '')}
        alt={person.username || ''}
        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        onError={() => setBroken(true)}
      />
    );
  }
  const initial = (person.username || person.full_name || '?')[0].toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
      <span className="text-white font-bold text-lg">{initial}</span>
    </div>
  );
}

export default function FollowingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    socialAPI.getFollowing(user.id as string)
      .then(data => setPeople(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const toggleFollow = async (id: string) => {
    const person = people.find(p => p.id === id);
    if (!person) return;
    const newFollowing = !person.is_following;
    setPeople(prev => prev.map(p => p.id === id ? { ...p, is_following: newFollowing } : p));
    try {
      await socialAPI.followUser(id);
    } catch {
      setPeople(prev => prev.map(p => p.id === id ? { ...p, is_following: !newFollowing } : p));
    }
  };

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-black pb-24 lg:pl-[72px]">
        <div className="sticky top-0 z-40 bg-black border-b border-[#2f3336]">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => router.push('/profile')} className="p-1 -ml-1">
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-[17px] font-bold" style={{ color: '#e7e9ea' }}>Following</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {loading && (
            <div className="py-16 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-zinc-900 border-t-violet-500 rounded-full animate-spin" />
            </div>
          )}

          {!loading && people.length === 0 && (
            <div className="py-24 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#e7e9ea' }}>Not following anyone yet</p>
              <p className="text-xs mt-1" style={{ color: '#8b9099' }}>Find people to follow from the search page.</p>
              <button
                onClick={() => router.push('/search')}
                className="mt-4 px-5 py-2 bg-violet-600 text-white text-sm font-bold rounded-full"
              >
                Find people
              </button>
            </div>
          )}

          {!loading && people.length > 0 && (
            <div className="divide-y divide-zinc-800">
              {people.map(person => (
                <div key={person.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar person={person} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold truncate" style={{ color: '#e7e9ea' }}>
                        {person.username || person.full_name}
                      </span>
                      {person.is_verified && (
                        <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {person.is_teacher && (
                        <span className="text-[9px] bg-violet-500/15 text-violet-400 border border-violet-500/30 rounded-full px-1.5 py-0.5 font-bold flex-shrink-0">Teacher</span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: '#8b9099' }}>@{person.username}</p>
                    {person.bio && <p className="text-xs truncate mt-0.5" style={{ color: '#8b9099' }}>{person.bio}</p>}
                  </div>
                  <button
                    onClick={() => toggleFollow(person.id)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      person.is_following
                        ? 'border border-zinc-700 text-zinc-300 bg-transparent'
                        : 'bg-white text-black hover:bg-zinc-100'
                    }`}
                  >
                    {person.is_following ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
