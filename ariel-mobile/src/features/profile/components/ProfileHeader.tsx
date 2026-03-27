import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  userId: string;
  username: string | null;
  fullName: string | null;
  bio: string | null;
  school?: string | null;
  profilePicture: string | null;
  cardsCount?: number;
  followersCount: number;
  followingCount: number;
  streak: number;
  level: number;
  isPremium?: boolean;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  isTogglingFollow?: boolean;
  onEditPress?: () => void;
  onFollowPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

// ─── Stat column ──────────────────────────────────────────────────────────────

function StatCol({
  value,
  label,
  onPress,
}: {
  value: number | string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={s.statCol}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Highlight bubble ─────────────────────────────────────────────────────────

function Highlight({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={s.highlight} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.highlightRing, { borderColor: color }]}>
        <View style={[s.highlightInner, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={26} color={color} />
        </View>
      </View>
      <Text style={s.highlightLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileHeader({
  userId,
  username,
  fullName,
  bio,
  school,
  profilePicture,
  cardsCount = 0,
  followersCount,
  followingCount,
  streak,
  level,
  isPremium = false,
  isOwnProfile,
  isFollowing = false,
  isTogglingFollow = false,
  onEditPress,
  onFollowPress,
  onFollowersPress,
  onFollowingPress,
}: ProfileHeaderProps) {
  const displayName = fullName ?? username ?? 'Unknown';
  const [imgErr, setImgErr] = React.useState(false);
  const hasAvatar = !!profilePicture && !imgErr;

  const handleShare = React.useCallback(async () => {
    const handle = username ?? userId;
    await Share.share({
      message: `Check out ${displayName} on Ariel — ariel.study/@${handle}`,
      url: `https://ariel.study/@${handle}`,
      title: `${displayName} on Ariel`,
    });
  }, [username, userId, displayName]);

  return (
    <View style={s.container}>
      {/* ── Avatar + Stats ── */}
      <View style={s.topRow}>
        {/* Avatar */}
        <View style={[s.avatarRing, isPremium && s.avatarRingPremium]}>
          {hasAvatar ? (
            <Image
              source={{ uri: profilePicture! }}
              style={s.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              onError={() => setImgErr(true)}
            />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCol value={cardsCount} label="Decks" />
          <StatCol value={followersCount} label="Followers" onPress={onFollowersPress} />
          <StatCol value={followingCount} label="Following" onPress={onFollowingPress} />
        </View>
      </View>

      {/* ── Name + bio ── */}
      <View style={s.nameBlock}>
        <View style={s.nameRow}>
          <Text style={s.fullName}>{displayName}</Text>
          {isPremium && (
            <View style={s.premiumBadge}>
              <Ionicons name="flash" size={10} color="#a855f7" />
              <Text style={s.premiumText}>Premium</Text>
            </View>
          )}
        </View>
        {!!bio && <Text style={s.bio}>{bio}</Text>}
        {!!school && (
          <View style={s.schoolRow}>
            <Ionicons name="school-outline" size={12} color="#71717a" />
            <Text style={s.school}>{school}</Text>
          </View>
        )}
      </View>

      {/* ── Action buttons ── */}
      <View style={s.actionRow}>
        {isOwnProfile ? (
          <>
            <TouchableOpacity style={s.btn} onPress={onEditPress} activeOpacity={0.8}>
              <Text style={s.btnText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btn} onPress={handleShare} activeOpacity={0.8}>
              <Text style={s.btnText}>Share profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnIcon} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={15} color="#fafafa" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[s.btn, !isFollowing && s.btnFollow]}
              onPress={onFollowPress}
              disabled={isTogglingFollow}
              activeOpacity={0.8}
            >
              <Text style={[s.btnText, !isFollowing && s.btnFollowText]}>
                {isTogglingFollow ? '···' : isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btn} activeOpacity={0.8}>
              <Text style={s.btnText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnIcon} activeOpacity={0.8}>
              <Ionicons name="chevron-down" size={15} color="#fafafa" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Story-style highlights ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.highlightsRow}
      >
        {isOwnProfile && (
          <TouchableOpacity style={s.highlight} activeOpacity={0.8}>
            <View style={[s.highlightRing, s.highlightRingDashed]}>
              <View style={[s.highlightInner, { backgroundColor: '#1c1c1e' }]}>
                <Ionicons name="add" size={26} color="#a1a1aa" />
              </View>
            </View>
            <Text style={s.highlightLabel}>New</Text>
          </TouchableOpacity>
        )}
        <Highlight icon="flame-outline"   label={`${streak}d streak`} color="#f97316" />
        <Highlight icon="star-outline"    label={`Level ${level}`}    color="#a855f7" />
        <Highlight icon="trophy-outline"  label="Trophies"            color="#eab308" />
        <Highlight icon="layers-outline"  label="Decks"               color="#22d3ee" />
      </ScrollView>

      {/* Divider */}
      <View style={s.divider} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 86;

const s = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    gap: 14,
  },

  // Row 1: avatar + stats
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 20,
  },
  avatarRing: {
    width: AVATAR_SIZE + 4,
    height: AVATAR_SIZE + 4,
    borderRadius: (AVATAR_SIZE + 4) / 2,
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingPremium: {
    borderColor: '#a855f7',
    borderWidth: 2,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fafafa',
    fontSize: 30,
    fontWeight: '700',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    color: '#fafafa',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statLabel: {
    color: '#a1a1aa',
    fontSize: 12,
  },

  // Name / bio
  nameBlock: {
    paddingHorizontal: 16,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullName: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
  },
  premiumText: {
    color: '#a855f7',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bio: {
    color: '#e4e4e7',
    fontSize: 13,
    lineHeight: 19,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  school: {
    color: '#71717a',
    fontSize: 12,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
  },
  btn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fafafa',
    fontSize: 13,
    fontWeight: '600',
  },
  btnIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFollow: {
    backgroundColor: '#0095f6',
    borderColor: '#0095f6',
  },
  btnFollowText: {
    color: '#fff',
  },

  // Highlights
  highlightsRow: {
    paddingHorizontal: 12,
    gap: 18,
  },
  highlight: {
    alignItems: 'center',
    gap: 6,
    width: 66,
  },
  highlightRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    borderColor: '#3f3f46',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightRingDashed: {
    borderStyle: 'dashed',
    borderColor: '#52525b',
  },
  highlightInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: {
    color: '#a1a1aa',
    fontSize: 10,
    textAlign: 'center',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#262626',
  },
});
