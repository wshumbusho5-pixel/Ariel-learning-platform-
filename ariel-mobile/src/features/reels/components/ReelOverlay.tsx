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
import { useNavigation } from '@react-navigation/native';
import type { ReelResponse } from '@/shared/types/reel';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Creator Avatar ────────────────────────────────────────────────────────────

function CreatorAvatar({ uri, username }: { uri?: string | null; username: string }) {
  const [imgErr, setImgErr] = React.useState(false);
  if (uri && !imgErr) {
    return (
      <Image source={{ uri }} style={styles.avatar} onError={() => setImgErr(true)} />
    );
  }
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarFallbackText}>{(username[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}

// ─── Side action button ────────────────────────────────────────────────────────

function SideAction({
  icon,
  label,
  onPress,
  active,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.sideAction} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={28} color={active ? '#a78bfa' : '#fff'} />
      <Text style={[styles.sideActionLabel, active && { color: '#a78bfa' }]}>{label}</Text>
    </TouchableOpacity>
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
  const navigation = useNavigation();

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Bottom scrim */}
      <View style={styles.bottomScrim} pointerEvents="none" />

      {/* Top-left: X close */}
      <TouchableOpacity
        style={styles.topLeftBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Top-right: mute */}
      <TouchableOpacity style={styles.topRightBtn} activeOpacity={0.8}>
        <Ionicons name="volume-mute-outline" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Bottom-left: title + creator */}
      <View style={styles.bottomLeft} pointerEvents="box-none">
        {reel.title ? (
          <Text style={styles.reelTitle} numberOfLines={2}>{reel.title}</Text>
        ) : null}
        <View style={styles.creatorRow}>
          <CreatorAvatar uri={reel.creator_profile_picture} username={reel.creator_username} />
          <Text style={styles.creatorUsername}>@{reel.creator_username}</Text>
          <TouchableOpacity style={styles.followBtn} activeOpacity={0.8}>
            <Text style={styles.followBtnText}>Follow</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom-right: Discuss / Save / Send */}
      <View style={styles.sideActions} pointerEvents="box-none">
        <SideAction
          icon="chatbubble-outline"
          label="Discuss"
          onPress={onComment}
        />
        <SideAction
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          label="Save"
          onPress={onSave}
          active={saved}
        />
        <SideAction
          icon="paper-plane-outline"
          label="Send"
          onPress={onShare}
        />
      </View>

      {/* Bottom progress bar */}
      <View style={styles.progressBar} pointerEvents="none">
        <View style={styles.progressFill} />
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // Top controls
  topLeftBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightBtn: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom-left
  bottomLeft: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 90,
    gap: 10,
  },
  reelTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124,58,237,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.5)',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  creatorUsername: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    flex: 1,
  },
  followBtn: {
    borderWidth: 1.5,
    borderColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  followBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Side actions — bottom-right
  sideActions: {
    position: 'absolute',
    bottom: 40,
    right: 16,
    alignItems: 'center',
    gap: 20,
  },
  sideAction: {
    alignItems: 'center',
    gap: 4,
  },
  sideActionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Progress bar
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    width: '30%',
    height: 2,
    backgroundColor: '#fff',
  },
});
