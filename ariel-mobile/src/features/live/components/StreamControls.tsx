import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '@/shared/constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StreamControlsProps {
  streamId: string;
  onEndStream: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StreamControls({
  streamId,
  onEndStream,
}: StreamControlsProps): React.ReactElement {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const handleEndStream = () => {
    Alert.alert(
      'End Stream',
      'Are you sure you want to end this stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: onEndStream,
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch my live stream on Ariel! Stream ID: ${streamId}`,
        title: 'Join my live stream',
      });
    } catch {
      // User dismissed
    }
  };

  return (
    <View style={styles.container}>
      {/* Mute toggle */}
      <TouchableOpacity
        style={[styles.controlButton, isMuted && styles.controlButtonActive]}
        onPress={() => setIsMuted((prev) => !prev)}
        activeOpacity={0.8}
      >
        <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
        <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
      </TouchableOpacity>

      {/* Camera toggle */}
      <TouchableOpacity
        style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
        onPress={() => setIsCameraOff((prev) => !prev)}
        activeOpacity={0.8}
      >
        <Text style={styles.controlIcon}>{isCameraOff ? '📵' : '📷'}</Text>
        <Text style={styles.controlLabel}>{isCameraOff ? 'Camera Off' : 'Camera'}</Text>
      </TouchableOpacity>

      {/* Share */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <Text style={styles.controlIcon}>🔗</Text>
        <Text style={styles.controlLabel}>Share</Text>
      </TouchableOpacity>

      {/* End stream */}
      <TouchableOpacity
        style={[styles.controlButton, styles.endButton]}
        onPress={handleEndStream}
        activeOpacity={0.8}
      >
        <Text style={styles.controlIcon}>⏹️</Text>
        <Text style={[styles.controlLabel, styles.endLabel]}>End</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BORDER_RADIUS.xl,
  },

  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 64,
  },

  controlButtonActive: {
    backgroundColor: COLORS.violet[700],
  },

  endButton: {
    backgroundColor: `${COLORS.error}22`,
    borderWidth: 1,
    borderColor: COLORS.error,
  },

  controlIcon: {
    fontSize: 20,
    marginBottom: 2,
  },

  controlLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },

  endLabel: {
    color: COLORS.error,
  },
});
