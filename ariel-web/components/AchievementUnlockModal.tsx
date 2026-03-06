'use client';

import { useEffect, useState } from 'react';

interface Achievement {
  achievement_id: string;
  title: string;
  icon: string;
  points: number;
  rarity: string;
}

interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  onClose: () => void;
  onShareToStory?: (achievementId: string) => void;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-zinc-500 to-zinc-600',
  legendary: 'from-yellow-400 to-orange-500',
};

export default function AchievementUnlockModal({
  achievement,
  onClose,
  onShareToStory
}: AchievementUnlockModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
    }
  }, [achievement]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const handleShare = () => {
    if (achievement && onShareToStory) {
      onShareToStory(achievement.achievement_id);
      handleClose();
    }
  };

  if (!achievement) return null;

  const rarityColor = rarityColors[achievement.rarity as keyof typeof rarityColors] || rarityColors.common;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${
        isVisible ? 'bg-opacity-70' : 'bg-opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${rarityColor} opacity-20 animate-pulse`} />

        {/* Content */}
        <div className="relative p-8 text-center">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Achievement Icon */}
          <div className="text-8xl mb-4 animate-bounce">
            {achievement.icon}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Achievement Unlocked!</h2>

          {/* Achievement Name */}
          <div className={`inline-block px-6 py-3 rounded-xl bg-gradient-to-br ${rarityColor} text-white mb-4`}>
            <p className="text-xl font-bold">{achievement.title}</p>
          </div>

          {/* Rarity Badge */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-bold uppercase text-gray-700">
              {achievement.rarity}
            </span>
          </div>

          {/* Points */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800 font-semibold">
              +{achievement.points} Points! 🏆
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className={`flex-1 py-3 rounded-xl bg-gradient-to-br ${rarityColor} text-white font-semibold hover:opacity-90 transition-opacity`}
            >
              Share to Story
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Confetti Effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
