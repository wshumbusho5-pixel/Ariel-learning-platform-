import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { SUBJECT_META } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';

const { width: SCREEN_W } = Dimensions.get('window');
export const COLS = 4;
export const TILE = (SCREEN_W - 32 - (COLS - 1) * 8) / COLS;

export function SubjectTile({ subjectKey, onPress }: { subjectKey: SubjectKey; onPress: () => void }) {
  const meta = SUBJECT_META[subjectKey];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.tile, { backgroundColor: meta.color + '22', borderColor: meta.color + '55' }]}
    >
      <Text style={styles.emoji}>{meta.icon}</Text>
      <Text style={styles.label} numberOfLines={1}>{meta.short}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emoji: { fontSize: 22 },
  label: { color: '#e4e4e7', fontSize: 10, fontWeight: '600', textAlign: 'center', paddingHorizontal: 2 },
});
