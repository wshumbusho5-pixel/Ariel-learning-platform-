'use client';

import { useState } from 'react';
import { achievementsAPI } from '@/lib/api';

interface AchievementCardProps {
  achievement: {
    achievement_id: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    current_value: number;
    target_value: number;
    percentage: number;
    is_unlocked: boolean;
    unlocked_at?: string;
    points_reward: number;
    shared_to_story?: boolean;
  };
  onShare?: () => void;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-500 to-pink-500',
  legendary: 'from-yellow-400 to-orange-500',
};

const rarityBorders = {
  common: 'border-gray-300',
  rare: 'border-blue-400',
  epic: 'border-purple-500',
  legendary: 'border-yellow-400',
};

export default function AchievementCard({ achievement, onShare }: AchievementCardProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      await achievementsAPI.shareAchievementToStory(achievement.achievement_id);
      onShare?.();
    } catch (error) {
      console.error('Error sharing achievement:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const rarityColor = rarityColors[achievement.rarity as keyof typeof rarityColors] || rarityColors.common;
  const rarityBorder = rarityBorders[achievement.rarity as keyof typeof rarityBorders] || rarityBorders.common;

  return (
    <div
      className={`relative rounded-xl p-6 transition-all ${
        achievement.is_unlocked
          ? `bg-gradient-to-br ${rarityColor} text-white shadow-lg`
          : 'bg-gray-50 border-2 border-gray-200'
      }`}
    >
      {/* Rarity Badge */}
      {achievement.is_unlocked && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-bold uppercase">
            {achievement.rarity}
          </span>
        </div>
      )}

      {/* Icon */}
      <div className="text-5xl mb-3 text-center">
        {achievement.is_unlocked ? achievement.icon : '🔒'}
      </div>

      {/* Title & Description */}
      <div className="text-center mb-4">
        <h3 className={`text-xl font-bold mb-1 ${!achievement.is_unlocked && 'text-gray-800'}`}>
          {achievement.is_unlocked ? achievement.title : '???'}
        </h3>
        <p className={`text-sm ${achievement.is_unlocked ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
          {achievement.is_unlocked ? achievement.description : 'Unlock to reveal'}
        </p>
      </div>

      {/* Progress Bar (if not unlocked) */}
      {!achievement.is_unlocked && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Progress</span>
            <span>{achievement.current_value} / {achievement.target_value}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
              style={{ width: `${achievement.percentage}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-500 mt-1">{achievement.percentage}% complete</p>
        </div>
      )}

      {/* Points */}
      <div className={`text-center py-2 border-t ${
        achievement.is_unlocked ? 'border-white border-opacity-20' : 'border-gray-200'
      }`}>
        <p className={`text-sm ${achievement.is_unlocked ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
          {achievement.is_unlocked ? '🏆' : '+'} {achievement.points_reward} points
        </p>
      </div>

      {/* Share to Story Button (if unlocked) */}
      {achievement.is_unlocked && !achievement.shared_to_story && (
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="mt-3 w-full bg-white bg-opacity-20 hover:bg-opacity-30 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isSharing ? 'Sharing...' : 'Share to Story'}
        </button>
      )}

      {achievement.is_unlocked && achievement.shared_to_story && (
        <div className="mt-3 text-center text-sm text-white text-opacity-70">
          Shared to your story ✓
        </div>
      )}

      {/* Unlocked Date */}
      {achievement.is_unlocked && achievement.unlocked_at && (
        <p className="text-xs text-white text-opacity-60 text-center mt-2">
          Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
