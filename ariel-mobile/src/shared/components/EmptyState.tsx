import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  action?: EmptyStateAction;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {action && (
        <TouchableOpacity style={styles.btn} onPress={action.onPress} activeOpacity={0.8}>
          <Text style={styles.btnText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  btn: {
    marginTop: 24,
    backgroundColor: COLORS.violet[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.full,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: TYPOGRAPHY.fontSize.base,
  },
});
