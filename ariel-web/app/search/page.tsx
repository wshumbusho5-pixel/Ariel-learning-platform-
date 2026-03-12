'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { socialAPI, messagesAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

interface Person {
  id: string;
  username: string;
  full_name?: string;
  profile_picture?: string;
  bio?: string;
  is_following: boolean;
  follows_you?: boolean;
  is_teacher?: boolean;
  is_verified?: boolean;
}

function Avatar({ person }: { person: Person }) {
  const [broken, setBroken] = useState(false);
  if (person.profile_picture && !broken) {
    return (
      <img
        src={person.profile_picture.replace(/^https?:\/\/[^/]+/, '')}
        alt={person.username}
        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center flex-shrink-0">
      <span className="text-white font-bold text-lg">{person.username[0]?.toUpperCase()}</span>
    </div>
  );
}

function PersonRow({ person, onToggleFollow, onOpenDM }: { person: Person; onToggleFollow: (id: string) => void; onOpenDM: (id: string) => void }) {
  const mutual = person.is_following && person.follows_you;
  const waitingFollowBack = person.is_following && !person.follows_you;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar person={person} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-bold text-zinc-900 truncate">
            {person.full_name || person.username}
          </span>
          {person.is_verified && (
            <svg className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {person.is_teacher && (
            <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-bold flex-shrink-0">Teacher</span>
          )}
        </div>
        <p className="text-xs text-zinc-400 truncate">@{person.username}</p>
        {person.bio && <p className="text-xs text-zinc-400 truncate mt-0.5">{person.bio}</p>}
        {waitingFollowBack && (
          <p className="text-[10px] text-zinc-400 mt-0.5">Follow back to message</p>
        )}
      </div>
      {mutual ? (
        <button
          onClick={() => onOpenDM(person.id)}
          className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        >
          Message
        </button>
      ) : waitingFollowBack ? (
        <span className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-zinc-400 border border-gray-200">
          Following
        </span>
      ) : (
        <button
          onClick={() => onToggleFollow(person.id)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
            person.follows_you
              ? 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {person.follows_you ? 'Follow Back' : 'Follow'}
        </button>
      )}
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDM = searchParams.get('dm') === '1';
  const [query, setQuery] = useState('');
  const [suggested, setSuggested] = useState<Person[]>([]);
  const [results, setResults] = useState<Person[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load suggested users on mount
  useEffect(() => {
    socialAPI.getSuggestedUsers(30)
      .then(data => setSuggested(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingSuggested(false));
    // Auto-focus the search bar
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Live search as user types
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoadingSearch(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await socialAPI.searchUsers(query.trim(), 30);
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const toggleFollow = (id: string) => {
    // Determine current state before updating
    const current = [...suggested, ...results].find(p => p.id === id);
    if (!current) return;
    const newFollowing = !current.is_following;

    // Update UI optimistically
    const update = (list: Person[]) =>
      list.map(p => p.id === id ? { ...p, is_following: newFollowing } : p);
    setSuggested(update);
    setResults(update);

    // Make API call exactly once (toggle endpoint handles both directions)
    socialAPI.followUser(id).catch(() => {
      // Revert on error
      const revert = (list: Person[]) =>
        list.map(p => p.id === id ? { ...p, is_following: !newFollowing } : p);
      setSuggested(revert);
      setResults(revert);
    });
  };

  const openDM = async (id: string) => {
    try {
      const res = await messagesAPI.getOrCreateConversation(id);
      router.push(`/messages/${res.conversation_id}`);
    } catch {}
  };

  const isSearching = query.trim().length >= 2;
  const displayList = isSearching ? results : suggested;
  const isLoading = isSearching ? loadingSearch : loadingSuggested;

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-white pb-20 lg:pl-[72px]">

        {/* Header — always-visible search bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.back()}>
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 h-10">
              <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={isDM ? 'Search to message...' : 'Search people...'}
                className="flex-1 bg-transparent text-zinc-900 text-sm outline-none placeholder:text-zinc-400"
              />
              {query && (
                <button onClick={() => setQuery('')}>
                  <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section label */}
        <div className="max-w-2xl mx-auto">
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {isSearching ? `Results for "${query}"` : 'Suggested for you'}
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="py-12 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-100 border-t-violet-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && displayList.length === 0 && (
            <div className="py-16 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700">
                {isSearching ? `No results for "${query}"` : 'No suggestions yet'}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {isSearching ? 'Try a different name or username' : 'More people will appear as the community grows'}
              </p>
            </div>
          )}

          {/* People list */}
          {!isLoading && displayList.length > 0 && (
            <div className="divide-y divide-gray-100">
              {displayList.map(person => (
                <PersonRow key={person.id} person={person} onToggleFollow={toggleFollow} onOpenDM={openDM} />
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </>
  );
}
