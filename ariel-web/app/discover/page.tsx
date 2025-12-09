'use client';

import { useEffect, useState } from 'react';
import { socialAPI } from '@/lib/api';
import UserCard from '@/components/UserCard';

export default function DiscoverPage() {
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadSuggestedUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 500); // Debounce search
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadSuggestedUsers = async () => {
    try {
      setIsLoading(true);
      const data = await socialAPI.getSuggestedUsers(20);
      setSuggestedUsers(data);
    } catch (error) {
      console.error('Error loading suggested users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    if (searchQuery.length < 2) return;

    try {
      setIsSearching(true);
      const data = await socialAPI.searchUsers(searchQuery, 20);
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const displayUsers = searchQuery.length >= 2 ? searchResults : suggestedUsers;
  const isDisplayLoading = searchQuery.length >= 2 ? isSearching : isLoading;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Discover People</h1>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by username, name, or school..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Section Title */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {searchQuery.length >= 2
              ? `Search Results (${searchResults.length})`
              : 'Suggested For You'}
          </h2>
          {!searchQuery && (
            <p className="text-sm text-gray-600 mt-1">
              Based on your subjects and school
            </p>
          )}
        </div>

        {/* Loading State */}
        {isDisplayLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">
                {searchQuery.length >= 2 ? 'Searching...' : 'Loading suggestions...'}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isDisplayLoading && displayUsers.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery.length >= 2 ? 'No users found' : 'No suggestions yet'}
            </h3>
            <p className="text-gray-600">
              {searchQuery.length >= 2
                ? 'Try a different search term'
                : 'Complete your profile to get personalized suggestions'}
            </p>
          </div>
        )}

        {/* Users List */}
        {!isDisplayLoading && displayUsers.length > 0 && (
          <div className="space-y-3">
            {displayUsers.map((user) => (
              <UserCard key={user.id} user={user} onFollowChange={loadSuggestedUsers} />
            ))}
          </div>
        )}

        {/* Tips Section */}
        {!searchQuery && !isLoading && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for finding study buddies</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Search for classmates by school name</li>
              <li>• Follow people studying same subjects</li>
              <li>• Look for verified teachers in your courses</li>
              <li>• Join subject communities to discover active learners</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
