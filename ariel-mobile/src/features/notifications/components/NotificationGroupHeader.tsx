import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/shared/constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NotificationGroupHeaderProps {
  title: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

function NotificationGroupHeaderComponent({
  title,
}: NotificationGroupHeaderProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {/* Left line */}
      <View style={styles.line} />

      {/* Label */}
      <Text style={styles.label}>{title.toUpperCase()}</Text>

      {/* Right line */}
      <View style={styles.line} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginHorizontal: SPACING.sm,
  },
});

export const NotificationGroupHeader = memo(NotificationGroupHeaderComponent);
