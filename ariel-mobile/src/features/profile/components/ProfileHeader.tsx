import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/shared/constants/theme';
import { Avatar } from '@/shared/components/Avatar';
import { SubjectTag } from '@/shared/components/SubjectTag';
import { StatsRow } from '@/features/profile/components/StatsRow';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  userId: string;
  username: string | null;
  fullName: string | null;
  bio: string | null;
  profilePicture: string | null;
  subjects: string[];
  followersCount: number;
  followingCount: number;
  streak: number;
  level: number;
  isPremium?: boolean;
  lastSeen?: string | null;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  isTogglingFollow?: boolean;
  onEditPress?: () => void;
  onFollowPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

// ─── Online Indicator ─────────────────────────────────────────────────────────

function isOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 2 * 60 * 1000; // < 2 minutes
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileHeader({
  userId,
  username,
  fullName,
  bio,
  profilePicture,
  subjects,
  followersCount,
  followingCount,
  streak,
  level,
  isPremium = false,
  lastSeen,
  isOwnProfile,
  isFollowing = false,
  isTogglingFollow = false,
  onEditPress,
  onFollowPress,
  onFollowersPress,
  onFollowingPress,
}: ProfileHeaderProps) {
  const online = isOnline(lastSeen);
  const displayName = fullName ?? username ?? 'Unknown';
  const handle = username ? `@${username}` : `#${userId.slice(0, 8)}`;

  return (
    <View style={styles.container}>
      {/* Avatar + name row */}
      <View style={styles.topRow}>
        {/* Avatar with optional premium ring and online dot */}
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatarRing, isPremium && styles.avatarRingPremium]}>
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Avatar
                uri={profilePicture}
                username={username ?? userId}
                size={76}
              />
            )}
          </View>
          {online && <View style={styles.onlineDot} />}
        </View>

        {/* Name + handle */}
        <View style={styles.nameBlock}>
          <Text style={styles.fullName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.username}>{handle}</Text>
        </View>
      </View>

      {/* Bio */}
      {bio ? (
        <Text style={styles.bio}>{bio}</Text>
      ) : null}

      {/* Stats row */}
      <StatsRow
        followersCount={followersCount}
        followingCount={followingCount}
        streak={streak}
        level={level}
        onFollowersPress={onFollowersPress}
        onFollowingPress={onFollowingPress}
      />

      {/* Subject tags */}
      {subjects.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subjectsRow}
        >
          {subjects.map((subject) => (
            <SubjectTag key={subject} subject={subject} size="sm" />
          ))}
        </ScrollView>
      )}

      {/* Action button */}
      <View style={styles.actionRow}>
        {isOwnProfile ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={onEditPress}
            activeOpacity={0.8}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isFollowing ? styles.followingButton : styles.followButton,
            ]}
            onPress={onFollowPress}
            activeOpacity={0.8}
            disabled={isTogglingFollow}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText,
              ]}
            >
              {isTogglingFollow ? '...' : isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },

  // Avatar
  avatarWrapper: {
    position: 'relative',
  },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarRingPremium: {
    borderColor: COLORS.violet[500],
    borderWidth: 3,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },

  // Name block
  nameBlock: {
    flex: 1,
  },
  fullName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    letterSpacing: -0.5,
  },
  username: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: 2,
  },

  // Bio
  bio: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
    paddingHorizontal: SPACING.lg,
  },

  // Subjects
  subjectsRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    flexDirection: 'row',
  },

  // Action button
  actionRow: {
    paddingHorizontal: SPACING.lg,
  },
  actionButton: {
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  followButton: {
    backgroundColor: COLORS.violet[600],
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  followingButtonText: {
    color: COLORS.textSecondary,
  },
});
