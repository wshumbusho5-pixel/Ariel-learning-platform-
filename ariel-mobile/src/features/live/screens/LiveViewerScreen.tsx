import React, { useCallback, useState } from 'react';
import {
  Share,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { getStreamById } from '@/features/live/api/liveApi';
import { useLiveSocket } from '@/features/live/hooks/useLiveSocket';
import { ViewerCount } from '@/features/live/components/ViewerCount';
import { LiveChat } from '@/features/live/components/LiveChat';
import { LiveReactionBar } from '@/features/live/components/LiveReactionBar';
import { getSubjectKey } from '@/shared/constants/subjects';
import { SUBJECT_META } from '@/shared/constants/subjects';
import type { LiveStackParamList } from '@/features/live/LiveNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

type LiveViewerNavProp = NativeStackNavigationProp<LiveStackParamList, 'LiveViewer'>;
type LiveViewerRouteProp = RouteProp<LiveStackParamList, 'LiveViewer'>;

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveViewerScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LiveViewerNavProp>();
  const route = useRoute<LiveViewerRouteProp>();
  const { streamId } = route.params;

  const [chatInput, setChatInput] = useState('');

  const { data: stream } = useQuery({
    queryKey: QUERY_KEYS.LIVE.detail(streamId),
    queryFn: () => getStreamById(streamId),
  });

  const handleStreamEnded = useCallback(() => {
    Alert.alert('Stream Ended', 'This stream has ended.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }, [navigation]);

  const { messages, viewerCount, reactions, sendChat, isConnected } = useLiveSocket({
    streamId,
    onStreamEnded: handleStreamEnded,
  });

  const handleSendChat = useCallback(() => {
    if (chatInput.trim()) {
      sendChat(chatInput);
      setChatInput('');
    }
  }, [chatInput, sendChat]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Determine subject accent color
  const subjectKey = stream
    ? getSubjectKey({ subject: stream.subject, topic: stream.topic })
    : 'other';
  const subjectMeta = SUBJECT_META[subjectKey];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Full-screen stream placeholder */}
      <View style={[styles.streamPlaceholder, { backgroundColor: `${subjectMeta.color}18` }]}>
        {/* Centered host info */}
        <View style={styles.streamCenter}>
          <Text style={styles.subjectIcon}>{subjectMeta.icon}</Text>
          {stream && (
            <>
              <Text style={styles.streamHostName}>
                {stream.streamer_username}
              </Text>
              <Text style={styles.streamSubjectLabel}>
                {subjectMeta.label}
              </Text>
              <Text style={styles.streamTitleCenter} numberOfLines={2}>
                {stream.title}
              </Text>
            </>
          )}
          {!isConnected && (
            <Text style={styles.connectingText}>Connecting...</Text>
          )}
        </View>
      </View>

      {/* Top bar overlay */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {/* LIVE badge */}
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Viewer count */}
        <ViewerCount count={viewerCount} />

        {/* Host name */}
        {stream && (
          <Text style={styles.topBarHostName} numberOfLines={1}>
            {stream.streamer_username}
          </Text>
        )}

        {/* Spacer */}
        <View style={styles.topBarSpacer} />

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Floating action buttons (right side) */}
      <View style={styles.floatingActions}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => sendChat('❤️')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>❤️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fabButton}
          onPress={async () => {
            
            Share.share({ message: `Watch this live stream on Ariel! ID: ${streamId}` });
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>🔗</Text>
        </TouchableOpacity>
      </View>

      {/* Reaction bar */}
      <LiveReactionBar reactions={reactions} />

      {/* Bottom chat area (40% of screen) */}
      <View style={[styles.chatArea, { paddingBottom: insets.bottom }]}>
        {/* Messages */}
        <LiveChat messages={messages} />

        {/* Chat input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Say something..."
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="send"
            onSubmitEditing={handleSendChat}
            blurOnSubmit={false}
            maxLength={200}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !chatInput.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendChat}
            disabled={!chatInput.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Stream placeholder
  streamPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamCenter: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: 32,
  },
  subjectIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  streamHostName: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    textAlign: 'center',
  },
  streamSubjectLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: TYPOGRAPHY.fontSize.base,
    textAlign: 'center',
  },
  streamTitleCenter: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  connectingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.md,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  topBarHostName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
    flex: 1,
  },
  topBarSpacer: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Floating action buttons
  floatingActions: {
    position: 'absolute',
    right: SPACING.lg,
    top: '50%',
    gap: SPACING.md,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 22,
  },

  // Chat area (bottom 40%)
  chatArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    // Gradient overlay via background
    backgroundColor: 'transparent',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.violet[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surface2,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 16,
  },
});
