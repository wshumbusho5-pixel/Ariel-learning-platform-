import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/shared/auth/useAuth';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/shared/constants/theme';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { UserDeckGrid } from '@/features/profile/components/UserDeckGrid';
import { getMyDecks } from '@/features/profile/api/profileApi';
import type { ProfileStackParamList } from '@/features/profile/ProfileNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

type Tab = 'Decks' | 'Saved' | 'Stats' | 'Achievements';

// ─── Tab Switcher ─────────────────────────────────────────────────────────────

interface TabSwitcherProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  const tabs: Tab[] = ['Decks', 'Saved', 'Stats', 'Achievements'];
  return (
    <View style={tabStyles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[tabStyles.tab, activeTab === tab && tabStyles.activeTab]}
          onPress={() => onTabChange(tab)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              tabStyles.tabText,
              activeTab === tab && tabStyles.activeTabText,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.violet[500],
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },
  activeTabText: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MyProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('Decks');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: decks = [],
    isLoading: decksLoading,
    refetch: refetchDecks,
  } = useQuery({
    queryKey: QUERY_KEYS.PROFILE.me(),
    queryFn: getMyDecks,
    enabled: Boolean(user),
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchDecks();
    setIsRefreshing(false);
  }, [refetchDecks]);

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.violet[500]} />
      </View>
    );
  }

  const isPremium = user.role === 'premium' || user.role === 'admin';

  const header = (
    <>
      <ProfileHeader
        userId={user.id ?? ''}
        username={user.username}
        fullName={user.full_name}
        bio={user.bio}
        profilePicture={user.profile_picture}
        subjects={user.subjects}
        followersCount={user.followers_count}
        followingCount={user.following_count}
        streak={user.current_streak}
        level={user.level}
        isPremium={isPremium}
        lastSeen={user.last_seen}
        isOwnProfile
        onEditPress={() => navigation.navigate('EditProfile')}
        onFollowersPress={() =>
          navigation.navigate('Followers', { userId: user.id ?? '' })
        }
        onFollowingPress={() =>
          navigation.navigate('Following', { userId: user.id ?? '' })
        }
      />
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Settings gear */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'Decks' ? (
        <UserDeckGrid
          decks={decks}
          isLoading={decksLoading}
          ListHeaderComponent={header}
        />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.violet[500]}
              colors={[COLORS.violet[500]]}
            />
          }
        >
          {header}
          {activeTab === 'Saved' && (
            <View style={styles.savedPlaceholder}>
              <Text style={styles.savedIcon}>🔖</Text>
              <Text style={styles.savedText}>Saved cards appear here</Text>
            </View>
          )}
          {activeTab === 'Stats' && (
            <TouchableOpacity
              style={styles.savedPlaceholder}
              onPress={() => navigation.navigate('Stats')}
              activeOpacity={0.7}
            >
              <Text style={styles.savedIcon}>📊</Text>
              <Text style={styles.savedText}>View detailed stats</Text>
              <Text style={[styles.savedText, { color: COLORS.violet[400], marginTop: 4 }]}>Tap to open →</Text>
            </TouchableOpacity>
          )}
          {activeTab === 'Achievements' && (
            <TouchableOpacity
              style={styles.savedPlaceholder}
              onPress={() => navigation.navigate('Achievements')}
              activeOpacity={0.7}
            >
              <Text style={styles.savedIcon}>🏆</Text>
              <Text style={styles.savedText}>View all achievements</Text>
              <Text style={[styles.savedText, { color: COLORS.violet[400], marginTop: 4 }]}>Tap to open →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  topBarTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
  settingsBtn: {
    padding: SPACING.xs,
  },
  settingsIcon: {
    fontSize: 22,
  },
  savedPlaceholder: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    gap: SPACING.sm,
  },
  savedIcon: {
    fontSize: 40,
  },
  savedText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
