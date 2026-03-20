import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@/shared/auth/useAuth';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/shared/constants/theme';
import type { ProfileStackParamList } from '@/features/profile/ProfileNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

interface SettingsRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  chevron?: boolean;
}

// ─── Settings Row ─────────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  onPress,
  destructive = false,
  chevron = true,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
      {chevron && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

interface SectionProps {
  title?: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  }, [logout]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account info */}
        {user && (
          <View style={styles.accountCard}>
            <Text style={styles.accountName}>{user.full_name ?? user.username ?? 'User'}</Text>
            <Text style={styles.accountEmail}>{user.email}</Text>
          </View>
        )}

        {/* Profile */}
        <Section title="Account">
          <SettingsRow
            icon="✏️"
            label="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
        </Section>

        {/* Gamification */}
        <Section title="Community">
          <SettingsRow
            icon="🏆"
            label="Leaderboard"
            onPress={() => navigation.navigate('Leaderboard')}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="🎖️"
            label="Achievements"
            onPress={() => navigation.navigate('Achievements')}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="⚡"
            label="Challenges"
            onPress={() => navigation.navigate('Challenges')}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="📊"
            label="My Stats"
            onPress={() => navigation.navigate('Stats')}
          />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <SettingsRow
            icon="🔔"
            label="Notifications"
            onPress={() => {
              // Notifications settings — future screen
            }}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="🔒"
            label="Privacy"
            onPress={() => {
              // Privacy settings — future screen
            }}
          />
        </Section>

        {/* Danger zone */}
        <Section title="Account Actions">
          <SettingsRow
            icon="🚪"
            label="Sign Out"
            onPress={handleSignOut}
            destructive
            chevron={false}
          />
        </Section>

        {/* App version */}
        <Text style={styles.versionText}>Ariel Learning Platform</Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: COLORS.textPrimary,
    fontSize: 20,
  },

  // Scroll
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },

  // Account card
  accountCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  accountName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  accountEmail: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: 4,
  },

  // Section
  section: {
    gap: SPACING.xs,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: SPACING.xs,
    marginBottom: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  rowIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },
  rowLabelDestructive: {
    color: COLORS.error,
  },
  chevron: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
  rowSeparator: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginLeft: SPACING.lg + 24 + SPACING.md,
  },

  // Version
  versionText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
