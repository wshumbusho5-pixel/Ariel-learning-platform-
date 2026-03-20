import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/shared/constants/theme';
import type { AchievementProgress } from '@/shared/types/gamification';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AchievementBadgesProps {
  achievements: AchievementProgress[];
  showLocked?: boolean;
}

// ─── Single Badge ─────────────────────────────────────────────────────────────

interface BadgeItemProps {
  achievement: AchievementProgress;
}

function BadgeItem({ achievement }: BadgeItemProps) {
  const locked = !achievement.is_unlocked;

  return (
    <View style={[styles.badge, locked && styles.badgeLocked]}>
      <View style={[styles.iconCircle, locked && styles.iconCircleLocked]}>
        <Text style={[styles.icon, locked && styles.iconLocked]}>
          {achievement.icon}
        </Text>
      </View>
      <Text
        style={[styles.badgeName, locked && styles.badgeNameLocked]}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>
      {!locked && achievement.points_reward > 0 && (
        <Text style={styles.points}>+{achievement.points_reward} pts</Text>
      )}
      {locked && (
        <Text style={styles.lockedLabel}>
          {achievement.current_value}/{achievement.target_value}
        </Text>
      )}
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AchievementBadges({
  achievements,
  showLocked = true,
}: AchievementBadgesProps) {
  const visible = showLocked
    ? achievements
    : achievements.filter((a) => a.is_unlocked);

  if (visible.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visible.map((achievement) => (
          <BadgeItem key={achievement.achievement_id} achievement={achievement} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },

  // Badge
  badge: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  badgeLocked: {
    opacity: 0.45,
  },

  // Icon circle
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.violet[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleLocked: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
  },
  icon: {
    fontSize: 24,
  },
  iconLocked: {
    fontSize: 20,
  },

  // Text
  badgeName: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.4,
  },
  badgeNameLocked: {
    color: COLORS.textMuted,
  },

  points: {
    color: COLORS.violet[400],
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  lockedLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
});
