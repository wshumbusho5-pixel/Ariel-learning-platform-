import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '@/shared/constants/theme';
import { SUBJECT_META } from '@/shared/constants/subjects';
import { getSubjectKey } from '@/shared/constants/subjects';
import type { LiveStreamWithStreamer } from '@/shared/types/livestream';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LiveCardProps {
  stream: LiveStreamWithStreamer;
  onPress: (stream: LiveStreamWithStreamer) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGradientColor(stream: LiveStreamWithStreamer): string {
  const key = getSubjectKey({ subject: stream.subject, topic: stream.topic });
  return SUBJECT_META[key].color;
}

function formatViewerCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveCard({ stream, onPress }: LiveCardProps): React.ReactElement {
  const accentColor = getGradientColor(stream);
  const subjectMeta = SUBJECT_META[getSubjectKey({ subject: stream.subject, topic: stream.topic })];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(stream)}
      activeOpacity={0.85}
    >
      {/* Thumbnail / gradient background */}
      <View style={[styles.thumbnail, { backgroundColor: `${accentColor}22` }]}>
        {stream.thumbnail_url ? (
          <Image
            source={{ uri: stream.thumbnail_url }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.gradientFill, { backgroundColor: `${accentColor}33` }]}>
            <Text style={[styles.subjectIcon, { color: accentColor }]}>
              {subjectMeta.icon}
            </Text>
          </View>
        )}

        {/* Top-left: LIVE pill */}
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Top-right: viewer count */}
        <View style={styles.viewerBadge}>
          <Text style={styles.viewerText}>👁 {formatViewerCount(stream.viewers_count)}</Text>
        </View>

        {/* Bottom overlay: host info + title */}
        <View style={styles.bottomOverlay}>
          <View style={styles.hostRow}>
            {stream.streamer_profile_picture ? (
              <Image
                source={{ uri: stream.streamer_profile_picture }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {stream.streamer_username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.hostTextGroup}>
              <Text style={styles.hostUsername} numberOfLines={1}>
                {stream.streamer_username}
              </Text>
              <Text style={styles.streamTitle} numberOfLines={1}>
                {stream.title}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },

  thumbnail: {
    height: 180,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  subjectIcon: {
    fontSize: 40,
  },

  // LIVE pill
  livePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.error,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    letterSpacing: 0.5,
  },

  // Viewer badge
  viewerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  viewerText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },

  // Bottom overlay
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarFallback: {
    backgroundColor: COLORS.violet[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  hostTextGroup: {
    flex: 1,
  },
  hostUsername: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  streamTitle: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
});
