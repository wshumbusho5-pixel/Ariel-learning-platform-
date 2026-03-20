import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import type { AchievementProgress, AchievementCategory } from '@/shared/types/gamification';

interface AchievementCardProps {
  achievement: AchievementProgress;
}

// Map category to a subject-inspired color for unlocked glow
const CATEGORY_COLOR: Record<AchievementCategory, string> = {
  streak:   COLORS.warning,
  cards:    COLORS.violet[400],
  social:   COLORS.subject.psychology,
  learning: COLORS.subject.sciences,
  special:  COLORS.subject.arts,
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { is_unlocked, icon, title, category } = achievement;
  const accentColor = CATEGORY_COLOR[category] ?? COLORS.violet[400];

  if (is_unlocked) {
    return (
      <View
        style={[
          styles.card,
          styles.unlockedCard,
          {
            backgroundColor: `${accentColor}22`, // ~13% opacity tint
            borderColor: accentColor,
          },
        ]}
        accessibilityLabel={`${title} achievement, unlocked`}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.nameUnlocked} numberOfLines={2}>
          {title}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.card, styles.lockedCard]}
      accessibilityLabel={`${title} achievement, locked`}
    >
      <Text style={[styles.icon, styles.iconLocked]}>{icon}</Text>
      <Text style={styles.nameLocked} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}

const CARD_SIZE = 90; // enough for 3-col grid with gutters

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    minHeight: CARD_SIZE,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    gap: SPACING.xs,
    margin: SPACING.xs / 2,
  },

  unlockedCard: {
    // bg and borderColor set inline
  },

  lockedCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    opacity: 0.5,
  },

  icon: {
    fontSize: 28,
    lineHeight: 36,
  },

  iconLocked: {
    opacity: 0.6,
  },

  nameUnlocked: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.4,
  },

  nameLocked: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.normal as any,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.4,
  },
});
