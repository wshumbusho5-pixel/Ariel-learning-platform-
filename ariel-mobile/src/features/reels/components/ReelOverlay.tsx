import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/shared/constants/theme';
import { normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import type { ReelResponse } from '@/shared/types/reel';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Map subject key → accent color (from theme subject palette)
const SUBJECT_COLOR: Partial<Record<SubjectKey, string>> = {
  mathematics:  COLORS.subject.mathematics,
  sciences:     COLORS.subject.sciences,
  technology:   COLORS.subject.technology,
  history:      COLORS.subject.history,
  literature:   COLORS.subject.literature,
  economics:    COLORS.subject.economics,
  languages:    COLORS.subject.languages,
  health:       COLORS.subject.health,
  psychology:   COLORS.subject.psychology,
  geography:    COLORS.subject.geography,
  gospel:       COLORS.subject.gospel,
  business:     COLORS.subject.business,
  law:          COLORS.subject.law,
  arts:         COLORS.subject.arts,
  engineering:  COLORS.subject.engineering,
};

function getSubjectColor(category?: string | null): string {
  const key = normalizeSubjectKey(category ?? '') as SubjectKey;
  return SUBJECT_COLOR[key] ?? COLORS.subject.other;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Action Button ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  count?: number;
  onPress: () => void;
  active?: boolean;
  activeColor?: string;
}

function ActionButton({ icon, count, onPress, active, activeColor = '#a78bfa' }: ActionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.actionBtn}
      accessibilityRole="button"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={icon}
        size={30}
        color={active ? activeColor : '#fff'}
        style={styles.actionIcon}
      />
      {count !== undefined && count > 0 && (
        <Text style={[styles.actionCount, active && { color: activeColor }]}>
          {formatCount(count)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Creator Avatar ────────────────────────────────────────────────────────────

function CreatorAvatar({ uri, username }: { uri?: string | null; username: string }) {
  const [imgErr, setImgErr] = React.useState(false);

  if (uri && !imgErr) {
    return (
      <Image
        source={{ uri }}
        style={styles.avatar}
        onError={() => setImgErr(true)}
      />
    );
  }

  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarFallbackText}>
        {(username[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Main Overlay ──────────────────────────────────────────────────────────────

interface ReelOverlayProps {
  reel: ReelResponse;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

export function ReelOverlay({
  reel,
  liked,
  saved,
  onLike,
  onComment,
  onShare,
  onSave,
}: ReelOverlayProps) {
  const subjectColor = getSubjectColor(reel.category);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Top fade — simulated gradient for status bar legibility */}
      <View style={styles.topFade} pointerEvents="none" />

      {/* Category tag (top-left, below status bar) */}
      {reel.category ? (
        <View style={[styles.categoryPill, { borderColor: subjectColor + '55' }]}>
          <Text style={[styles.categoryText, { color: subjectColor }]}>
            {reel.category}
          </Text>
        </View>
      ) : null}

      {/* Bottom fade — simulated gradient for controls legibility */}
      <View style={styles.bottomFade} pointerEvents="none" />

      {/* Bottom-left: creator info */}
      <View style={styles.creatorInfo} pointerEvents="box-none">
        <View style={styles.creatorRow}>
          <CreatorAvatar
            uri={reel.creator_profile_picture}
            username={reel.creator_username}
          />
          <View style={styles.creatorTextBlock}>
            <Text style={styles.creatorUsername} numberOfLines={1}>
              @{reel.creator_username}
              {reel.creator_verified ? (
                <Text style={styles.verifiedDot}> ✓</Text>
              ) : null}
            </Text>
          </View>
        </View>
        <Text style={styles.reelTitle} numberOfLines={2}>
          {reel.title}
        </Text>
        {reel.description ? (
          <Text style={styles.reelDescription} numberOfLines={2}>
            {reel.description}
          </Text>
        ) : null}
        {reel.category ? (
          <View style={[styles.subjectTag, { backgroundColor: subjectColor + '22' }]}>
            <Text style={[styles.subjectTagText, { color: subjectColor }]}>
              {reel.category}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Bottom-right: action buttons */}
      <View style={styles.actions}>
        <ActionButton
          icon={liked ? 'heart' : 'heart-outline'}
          count={reel.likes}
          onPress={onLike}
          active={liked}
          activeColor="#f87171"
        />
        <ActionButton
          icon="chatbubble-ellipses-outline"
          count={reel.comments_count}
          onPress={onComment}
        />
        <ActionButton
          icon="arrow-redo-outline"
          count={reel.shares_count > 0 ? reel.shares_count : undefined}
          onPress={onShare}
        />
        <ActionButton
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          onPress={onSave}
          active={saved}
          activeColor="#a78bfa"
        />
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  // Simulated top gradient (black → transparent) using overlapping View
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  // Simulated bottom gradient (transparent → black)
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  categoryPill: {
    position: 'absolute',
    top: SPACING['5xl'],
    left: SPACING.lg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    letterSpacing: 0.3,
  },

  // Creator info — bottom-left
  creatorInfo: {
    position: 'absolute',
    bottom: 120,
    left: SPACING.lg,
    right: 80, // leave room for action buttons on the right
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: COLORS.violet[300],
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
  },
  creatorTextBlock: {
    flex: 1,
  },
  creatorUsername: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedDot: {
    color: COLORS.violet[400],
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  reelTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    lineHeight: TYPOGRAPHY.fontSize.base * 1.35,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  reelDescription: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    marginTop: 2,
  },
  subjectTagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    letterSpacing: 0.2,
  },

  // Action buttons — bottom-right
  actions: {
    position: 'absolute',
    bottom: 120,
    right: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xl,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionCount: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
