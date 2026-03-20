import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/shared/constants/theme';
import { Avatar } from '@/shared/components/Avatar';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

import { getFollowers, type FollowerUser } from '@/features/profile/api/profileApi';
import type { ProfileStackParamList } from '@/features/profile/ProfileNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Followers'>;
type Route = RouteProp<ProfileStackParamList, 'Followers'>;

// ─── User Row ─────────────────────────────────────────────────────────────────

interface UserRowProps {
  user: FollowerUser;
  onPress: (userId: string) => void;
}

function UserRow({ user, onPress }: UserRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(user.id)}
      activeOpacity={0.7}
    >
      <Avatar
        uri={user.profile_picture}
        username={user.username ?? user.id}
        size={44}
      />
      <View style={styles.rowInfo}>
        <Text style={styles.fullName} numberOfLines={1}>
          {user.full_name ?? user.username ?? 'Unknown'}
        </Text>
        {user.username ? (
          <Text style={styles.username}>@{user.username}</Text>
        ) : null}
        {user.bio ? (
          <Text style={styles.bio} numberOfLines={1}>
            {user.bio}
          </Text>
        ) : null}
      </View>
      <View style={[styles.followBadge, user.is_following && styles.followingBadge]}>
        <Text style={[styles.followBadgeText, user.is_following && styles.followingBadgeText]}>
          {user.is_following ? 'Following' : 'Follow'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function FollowersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { userId } = route.params;

  const { data: followers = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.PROFILE.followers(userId),
    queryFn: () => getFollowers(userId),
    enabled: Boolean(userId),
  });

  const handleUserPress = useCallback(
    (uid: string) => {
      navigation.navigate('UserProfile', { userId: uid });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FollowerUser>) => (
      <UserRow user={item} onPress={handleUserPress} />
    ),
    [handleUserPress],
  );

  const keyExtractor = useCallback((item: FollowerUser) => item.id, []);

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
        <Text style={styles.headerTitle}>Followers</Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.violet[500]} />
        </View>
      ) : (
        <FlatList
          data={followers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No followers yet</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
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
    alignItems: 'center',
    justifyContent: 'center',
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

  // List
  listContent: {
    paddingVertical: SPACING.sm,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  rowInfo: {
    flex: 1,
  },
  fullName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  username: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 1,
  },
  bio: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },

  // Follow badge
  followBadge: {
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.violet[500],
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
  },
  followingBadge: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
  },
  followBadgeText: {
    color: COLORS.violet[400],
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  followingBadgeText: {
    color: COLORS.textMuted,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    gap: SPACING.sm,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
