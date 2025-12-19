'use client';

import { useState, useEffect } from 'react';
import { storiesAPI } from '@/lib/api';

interface Story {
  id: string;
  content: string;
  background_color: string;
  image_url?: string;
  story_type: string;
  views: number;
  time_remaining_hours: number;
  created_at: string;
  author_username?: string;
  author_full_name?: string;
  author_profile_picture?: string;
  author_is_verified: boolean;

  // Type-specific
  streak_count?: number;
  achievement_title?: string;
  achievement_icon?: string;
  deck_title?: string;
  deck_subject?: string;
  cards_reviewed?: number;
  time_spent_minutes?: number;
}

interface StoryViewerProps {
  storyGroup: any; // StoryGroup from API
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function StoryViewer({ storyGroup, onClose, onNext, onPrevious }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const stories = storyGroup.stories;
  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!currentStory) return;

    // Mark as viewed
    markViewed(currentStory.id);

    // Progress bar animation
    const duration = 5000; // 5 seconds per story
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + increment;
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused]);

  const markViewed = async (storyId: string) => {
    try {
      await storiesAPI.markStoryViewed(storyId);
    } catch (error) {
      console.error('Error marking story viewed:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      // Move to next user's stories
      onNext?.();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    } else {
      // Move to previous user's stories
      onPrevious?.();
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 2) {
      handlePrevious();
    } else {
      handleNext();
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((story: Story, index: number) => (
          <div key={index} className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            {currentStory.author_profile_picture ? (
              <img
                src={currentStory.author_profile_picture}
                alt={currentStory.author_username || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (currentStory.author_username?.[0] || currentStory.author_full_name?.[0] || 'U').toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-white font-medium text-sm">
                {currentStory.author_full_name || currentStory.author_username || 'User'}
              </span>
              {currentStory.author_is_verified && (
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-white text-opacity-70 text-xs">
              {currentStory.time_remaining_hours}h remaining
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-30 hover:bg-opacity-50 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Story Content */}
      <div
        className="w-full max-w-md h-full flex items-center justify-center cursor-pointer select-none"
        onClick={handleTap}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ backgroundColor: currentStory.background_color }}
      >
        <div className="p-8 text-center text-white max-w-sm">
          {/* Type-specific content */}
          {currentStory.story_type === 'streak' && currentStory.streak_count && (
            <div className="mb-4">
              <div className="text-6xl mb-2">🔥</div>
              <div className="text-4xl font-bold mb-2">{currentStory.streak_count}-Day Streak!</div>
            </div>
          )}

          {currentStory.story_type === 'achievement' && (
            <div className="mb-4">
              <div className="text-6xl mb-2">{currentStory.achievement_icon || '🏆'}</div>
              <div className="text-2xl font-bold mb-2">{currentStory.achievement_title}</div>
            </div>
          )}

          {currentStory.story_type === 'deck_post' && (
            <div className="mb-4">
              <div className="text-6xl mb-2">🎯</div>
              <div className="text-xl font-bold mb-1">New Deck Posted!</div>
              <div className="text-lg opacity-90">{currentStory.deck_title}</div>
              <div className="text-sm opacity-70 mt-1">{currentStory.deck_subject}</div>
            </div>
          )}

          {currentStory.story_type === 'study_session' && (
            <div className="mb-4">
              <div className="text-6xl mb-2">📚</div>
              <div className="text-3xl font-bold mb-2">{currentStory.cards_reviewed} cards</div>
              <div className="text-lg opacity-90">in {currentStory.time_spent_minutes} minutes</div>
            </div>
          )}

          {/* Main content */}
          <p className="text-xl font-bold leading-relaxed whitespace-pre-wrap">
            {currentStory.content}
          </p>
        </div>
      </div>

      {/* View Count (bottom) */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-opacity-70 text-sm">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>{currentStory.views} views</span>
        </div>

        {/* Navigation hints */}
        <div className="text-xs opacity-50">
          Tap left/right to navigate
        </div>
      </div>
    </div>
  );
}
