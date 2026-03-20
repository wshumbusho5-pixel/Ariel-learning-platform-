import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import type { ChallengeWithProgress } from '@/shared/types/gamification';

interface ChallengeCardProps {
  challenge: ChallengeWithProgress;
  onJoin?: (id: string) => void;
  joining?: boolean;
}

export function ChallengeCard({ challenge, onJoin, joining = false }: ChallengeCardProps) {
  const {
    id,
    icon,
    title,
    description,
    days_remaining,
    points_reward,
    percentage,
    is_joined,
    is_completed,
  } = challenge;

  const fillPct = Math.min(100, Math.max(0, percentage));

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      {is_joined && (
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${fillPct}%` as any,
                  backgroundColor: is_completed ? COLORS.success : COLORS.violet[500],
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {is_completed ? 'Completed!' : `${Math.round(fillPct)}% complete`}
          </Text>
        </View>
      )}

      {/* Footer row */}
      <View style={styles.footerRow}>
        {/* Deadline + reward */}
        <View style={styles.metaGroup}>
          <Text style={styles.meta}>
            {days_remaining > 0 ? `${days_remaining}d left` : 'Ends today'}
          </Text>
          <Text style={styles.metaDivider}> · </Text>
          <Text style={styles.reward}>+{points_reward} XP</Text>
        </View>

        {/* Action button */}
        {!is_joined ? (
          <TouchableOpacity
            style={[styles.joinBtn, joining && styles.joinBtnDisabled]}
            onPress={() => onJoin?.(id)}
            disabled={joining}
            accessibilityRole="button"
            accessibilityLabel={`Join challenge: ${title}`}
          >
            <Text style={styles.joinBtnText}>
              {joining ? 'Joining…' : 'Join'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedBadgeText}>Joined</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },

  icon: {
    fontSize: 28,
    lineHeight: 36,
  },

  titleBlock: {
    flex: 1,
    gap: 4,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
  },

  description: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
  },

  progressSection: {
    gap: SPACING.xs,
  },

  progressTrack: {
    height: 6,
    backgroundColor: COLORS.surface2,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },

  progressLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  meta: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },

  metaDivider: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },

  reward: {
    color: COLORS.violet[400],
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
  },

  joinBtn: {
    backgroundColor: COLORS.violet[600],
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },

  joinBtnDisabled: {
    opacity: 0.5,
  },

  joinBtnText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
  },

  joinedBadge: {
    borderWidth: 1,
    borderColor: COLORS.violet[600],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },

  joinedBadgeText: {
    color: COLORS.violet[400],
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
  },
});
