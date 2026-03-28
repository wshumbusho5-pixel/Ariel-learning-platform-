import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SUBJECT_META } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/shared/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubjectPillProps {
  subjectKey: SubjectKey;
  selected: boolean;
  onToggle: (key: SubjectKey) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SubjectPill({ subjectKey, selected, onToggle }: SubjectPillProps) {
  const meta = SUBJECT_META[subjectKey];
  const color = meta.color;

  return (
    <TouchableOpacity
      style={[
        styles.pill,
        {
          backgroundColor: selected ? `${color}33` : COLORS.surface2,
          borderColor: selected ? color : COLORS.border,
        },
      ]}
      onPress={() => onToggle(subjectKey)}
      activeOpacity={0.7}
    >
      <Ionicons name={meta.icon as any} size={13} color={selected ? color : COLORS.textSecondary} />
      <Text style={[styles.label, { color: selected ? color : COLORS.textSecondary }]}>
        {meta.short}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    gap: 4,
    margin: 3,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
});
