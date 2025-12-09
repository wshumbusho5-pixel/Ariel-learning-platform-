'use client';

import { useState, useEffect } from 'react';
import { storiesAPI } from '@/lib/api';
import CreateStoryModal from './CreateStoryModal';
import StoryViewer from './StoryViewer';

interface StoryGroup {
  user_id: string;
  username?: string;
  full_name?: string;
  profile_picture?: string;
  is_verified: boolean;
  stories: any[];
  total_stories: number;
  unviewed_count: number;
  latest_story_time: string;
}

export default function StoryCarousel() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [myStories, setMyStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setIsLoading(true);
      const [feedData, myStoriesData] = await Promise.all([
        storiesAPI.getStoryFeed(),
        storiesAPI.getMyStories(),
      ]);
      setStoryGroups(feedData);
      setMyStories(myStoriesData);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (viewingStoryIndex !== null && viewingStoryIndex < storyGroups.length - 1) {
      setViewingStoryIndex(viewingStoryIndex + 1);
    } else {
      setViewingStoryIndex(null);
    }
  };

  const handlePrevious = () => {
    if (viewingStoryIndex !== null && viewingStoryIndex > 0) {
      setViewingStoryIndex(viewingStoryIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-16 h-3 bg-gray-200 rounded mt-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {/* Your Story / Add Story */}
          <div
            className="flex-shrink-0 cursor-pointer"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <div className="relative">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                myStories.length > 0
                  ? 'bg-gradient-to-br from-blue-400 to-purple-500 p-0.5'
                  : 'bg-gray-200'
              }`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  {myStories.length > 0 ? (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      You
                    </div>
                  ) : (
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </div>
              </div>
              {myStories.length === 0 && (
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs text-center mt-2 font-medium text-gray-900 truncate w-16">
              {myStories.length > 0 ? 'Your Story' : 'Add Story'}
            </p>
          </div>

          {/* Friends' Stories */}
          {storyGroups.map((group, index) => (
            <div
              key={group.user_id}
              className="flex-shrink-0 cursor-pointer"
              onClick={() => setViewingStoryIndex(index)}
            >
              <div className={`w-16 h-16 rounded-full p-0.5 ${
                group.unviewed_count > 0
                  ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500'
                  : 'bg-gray-300'
              }`}>
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {group.profile_picture ? (
                      <img
                        src={group.profile_picture}
                        alt={group.username || group.full_name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      (group.username?.[0] || group.full_name?.[0] || 'U').toUpperCase()
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center mt-2">
                <p className="text-xs text-center font-medium text-gray-900 truncate w-16">
                  {group.username || group.full_name || 'User'}
                </p>
                {group.is_verified && (
                  <svg className="w-3 h-3 text-blue-500 flex-shrink-0 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {group.unviewed_count > 0 && (
                <div className="flex justify-center mt-1">
                  <span className="text-xs font-bold text-blue-500">
                    {group.unviewed_count} new
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {storyGroups.length === 0 && myStories.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-8 text-center">
              <div>
                <div className="text-4xl mb-2">📸</div>
                <p className="text-gray-600 text-sm">No stories yet</p>
                <p className="text-gray-500 text-xs mt-1">Be the first to share!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadStories();
        }}
      />

      {/* Story Viewer */}
      {viewingStoryIndex !== null && storyGroups[viewingStoryIndex] && (
        <StoryViewer
          storyGroup={storyGroups[viewingStoryIndex]}
          onClose={() => {
            setViewingStoryIndex(null);
            loadStories(); // Refresh to update view counts
          }}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}
    </>
  );
}
