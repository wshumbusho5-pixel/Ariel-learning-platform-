import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/shared/constants/theme';

export function CreateReelScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📹</Text>
      <Text style={styles.message}>Reel recording coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 48,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
    textAlign: 'center',
  },
});
