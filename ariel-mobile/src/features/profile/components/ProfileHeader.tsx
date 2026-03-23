import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// ─── Stat Column ──────────────────────────────────────────────────────────────

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
    <TouchableOpacity style={s.statCol} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Highlight Bubble ─────────────────────────────────────────────────────────

function HighlightBubble({
  icon,
  label,
  value,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string | number;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={s.highlight} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.highlightCircle, { borderColor: color }]}>
        <Text style={s.highlightIcon}>{icon}</Text>
        {value !== undefined && (
          <Text style={[s.highlightValue, { color }]}>{value}</Text>
        )}
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
  const handle = username ?? `user_${userId.slice(0, 8)}`;
  const [imgErr, setImgErr] = React.useState(false);
  const hasAvatar = !!profilePicture && !imgErr;

  return (
    <View style={s.container}>
      {/* ── Avatar + Stats row ── */}
      <View style={s.avatarStatsRow}>
        {/* Avatar */}
        <View style={s.avatarWrap}>
          <View style={[s.avatarRing, isPremium && s.avatarRingPremium]}>
            {hasAvatar ? (
              <Image
                source={{ uri: profilePicture! }}
                style={s.avatar}
                onError={() => setImgErr(true)}
              />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarFallbackText}>
                  {(displayName).charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCol value={cardsCount} label="Cards" />
          <StatCol value={followersCount} label="Followers" onPress={onFollowersPress} />
          <StatCol value={followingCount} label="Following" onPress={onFollowingPress} />
        </View>
      </View>

      {/* ── Name + bio ── */}
      <View style={s.nameBlock}>
        <Text style={s.fullName}>{displayName}</Text>
        {isPremium && (
          <Text style={s.premiumBadge}>⚡ Premium</Text>
        )}
        {!!bio && <Text style={s.bio}>{bio}</Text>}
        {!!school && (
          <View style={s.schoolRow}>
            <Ionicons name="school-outline" size={13} color="#a1a1aa" />
            <Text style={s.school}>{school}</Text>
          </View>
        )}
      </View>

      {/* ── Action buttons ── */}
      <View style={s.actionRow}>
        {isOwnProfile ? (
          <>
            <TouchableOpacity style={s.actionBtn} onPress={onEditPress} activeOpacity={0.8}>
              <Text style={s.actionBtnText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} activeOpacity={0.8}>
              <Text style={s.actionBtnText}>Share profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtnIcon} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={16} color="#fafafa" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[s.actionBtn, !isFollowing && s.followBtn]}
              onPress={onFollowPress}
              activeOpacity={0.8}
              disabled={isTogglingFollow}
            >
              <Text style={[s.actionBtnText, !isFollowing && s.followBtnText]}>
                {isTogglingFollow ? '...' : isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} activeOpacity={0.8}>
              <Text style={s.actionBtnText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtnIcon} activeOpacity={0.8}>
              <Ionicons name="chevron-down" size={16} color="#fafafa" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Highlights / story bubbles ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.highlightsRow}
      >
        {isOwnProfile && (
          <TouchableOpacity style={s.highlight} activeOpacity={0.8}>
            <View style={[s.highlightCircle, s.highlightNew]}>
              <Ionicons name="add" size={28} color="#fafafa" />
            </View>
            <Text style={s.highlightLabel}>New</Text>
          </TouchableOpacity>
        )}
        <HighlightBubble icon="🔥" label="Streak" value={streak} color="#f97316" />
        <HighlightBubble icon="⭐" label={`Lvl ${level}`} color="#a855f7" />
        <HighlightBubble icon="🏆" label="Trophies" color="#eab308" />
        <HighlightBubble icon="📚" label="Decks" value={cardsCount > 0 ? cardsCount : undefined} color="#22d3ee" />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    paddingBottom: 4,
    gap: 14,
  },

  // Avatar + stats
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  avatarWrap: {},
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    borderWidth: 2,
    borderColor: '#3f3f46',
  },
  avatarRingPremium: {
    borderColor: '#a855f7',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },

  // Stats
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '400',
  },

  // Name / bio
  nameBlock: {
    paddingHorizontal: 16,
    gap: 3,
  },
  fullName: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '700',
  },
  premiumBadge: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: '600',
  },
  bio: {
    color: '#e4e4e7',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  school: {
    color: '#a1a1aa',
    fontSize: 12,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 32,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fafafa',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtn: {
    backgroundColor: '#0095f6',
    borderColor: '#0095f6',
  },
  followBtnText: {
    color: '#fff',
  },

  // Highlights
  highlightsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 4,
    gap: 16,
  },
  highlight: {
    alignItems: 'center',
    gap: 6,
    width: 68,
  },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#3f3f46',
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  highlightNew: {
    borderColor: '#3f3f46',
    borderStyle: 'dashed',
  },
  highlightIcon: {
    fontSize: 22,
    lineHeight: 26,
  },
  highlightValue: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  highlightLabel: {
    color: '#a1a1aa',
    fontSize: 11,
    textAlign: 'center',
  },
});
