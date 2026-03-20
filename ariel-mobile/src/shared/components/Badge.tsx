import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  level: number;
  xp: number;
  size?: 'sm' | 'md';
}

export function Badge({ level, xp, size = 'md' }: BadgeProps): React.ReactElement {
  const isSm = size === 'sm';

  return (
    <View style={[styles.container, isSm ? styles.containerSm : styles.containerMd]}>
      <Text style={[styles.levelText, isSm ? styles.levelSm : styles.levelMd]}>
        Lv {level}
      </Text>
      {!isSm && (
        <Text style={styles.xpText}>{xp.toLocaleString()} XP</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#7c3aed',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 0,
  },
  containerMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 4,
  },
  levelText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  levelSm: {
    fontSize: 11,
  },
  levelMd: {
    fontSize: 13,
  },
  xpText: {
    color: '#ddd6fe',
    fontSize: 12,
    fontWeight: '500',
  },
});
