import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';

interface XPBarProps {
  level: number;
  xp: number;
  xpToNext: number;
  xpPercent: number;
}

export function XPBar({ level, xp, xpToNext, xpPercent }: XPBarProps) {
  const fillPercent = Math.max(0, Math.min(100, xpPercent));

  return (
    <View style={styles.container}>
      {/* Labels row */}
      <View style={styles.labelsRow}>
        <Text style={styles.levelLabel}>Level {level}</Text>
        <Text style={styles.xpLabel}>
          {xp.toLocaleString()} / {xpToNext.toLocaleString()} XP
        </Text>
      </View>

      {/* Track */}
      <View style={styles.track}>
        {/* Fill */}
        <View style={[styles.fill, { width: `${fillPercent}%` as any }]} />
        {/* Shine overlay */}
        <View style={[styles.shine, { width: `${fillPercent}%` as any }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  levelLabel: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
  },

  xpLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
  },

  track: {
    height: 8,
    backgroundColor: COLORS.surface2,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    position: 'relative',
  },

  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: BORDER_RADIUS.full,
    // violet → indigo gradient approximated with violet-500
    backgroundColor: COLORS.violet[500],
  },

  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
