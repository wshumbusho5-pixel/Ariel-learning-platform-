import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/shared/auth/useAuth';
import { COLORS, TYPOGRAPHY, SPACING } from '@/shared/constants/theme';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { UserDeckGrid } from '@/features/profile/components/UserDeckGrid';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { getMyDecks } from '@/features/profile/api/profileApi';
import type { ProfileStackParamList } from '@/features/profile/ProfileNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'UserProfile'>;
type Route = RouteProp<ProfileStackParamList, 'UserProfile'>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export function UserProfileScreen() {
  const { width: W, height: H } = useWindowDimensions();
  const isShort = H < 720;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { userId } = route.params;

  const { user: currentUser } = useAuth();
  const { profile, isFollowing, toggleFollow, isLoading, isTogglingFollow } =
    useProfile(userId);

  const {
    data: decks = [],
    isLoading: decksLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.PROFILE.user(userId),
    queryFn: () => getMyDecks(), // public decks for user — adjust if API differs
    enabled: Boolean(userId),
  });

  const isOwnProfile = currentUser?.id === userId;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.violet[500]} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  const isPremium = false; // Public profile doesn't expose role — use default

  const header = (
    <ProfileHeader
      userId={userId}
      username={profile.username}
      fullName={profile.full_name}
      bio={profile.bio}
      profilePicture={profile.profile_picture}
      followersCount={profile.followers_count}
      followingCount={profile.following_count}
      streak={profile.current_streak}
      level={profile.level}
      isPremium={isPremium}
      isOwnProfile={isOwnProfile}
      isFollowing={isFollowing}
      isTogglingFollow={isTogglingFollow}
      onFollowPress={() => toggleFollow()}
      onEditPress={() => navigation.navigate('EditProfile')}
      onFollowersPress={() => navigation.navigate('Followers', { userId })}
      onFollowingPress={() => navigation.navigate('Following', { userId })}
    />
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Back button */}
      <View style={[styles.topBar, isShort && styles.topBarShort]}>
        <TouchableOpacity
          style={[styles.backBtn, isShort && styles.backBtnShort]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, isShort && styles.backIconShort]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, isShort && styles.topBarTitleShort]}>
          {profile.username ?? 'Profile'}
        </Text>
        <View style={[styles.backBtn, isShort && styles.backBtnShort]} />
      </View>

      <UserDeckGrid
        decks={decks}
        isLoading={decksLoading}
        ListHeaderComponent={header}
      />
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
  topBarShort: {
    paddingVertical: 4,
  },
  topBarTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  topBarTitleShort: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnShort: {
    width: 28,
    height: 28,
  },
  backIcon: {
    color: COLORS.textPrimary,
    fontSize: 20,
  },
  backIconShort: {
    fontSize: 16,
  },
  errorText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.base,
  },
});
