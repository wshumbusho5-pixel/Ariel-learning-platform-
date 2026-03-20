import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/shared/constants/theme';
import { SUBJECT_META, CANONICAL_SUBJECT_KEYS } from '@/shared/constants/subjects';
import { createStream, startStream, endStream } from '@/features/live/api/liveApi';
import { useLiveSocket } from '@/features/live/hooks/useLiveSocket';
import { StreamControls } from '@/features/live/components/StreamControls';
import { ViewerCount } from '@/features/live/components/ViewerCount';
import { LiveChat } from '@/features/live/components/LiveChat';
import type { LiveStackParamList } from '@/features/live/LiveNavigator';
import type { StreamCategory } from '@/shared/types/livestream';

// ─── Types ────────────────────────────────────────────────────────────────────

type LiveHostNavProp = NativeStackNavigationProp<LiveStackParamList, 'LiveHost'>;

type HostPhase = 'setup' | 'live';

// ─── Setup screen ─────────────────────────────────────────────────────────────

interface SetupViewProps {
  title: string;
  setTitle: (v: string) => void;
  selectedSubject: string;
  setSelectedSubject: (v: string) => void;
  isStarting: boolean;
  onStart: () => void;
  onBack: () => void;
}

function SetupView({
  title,
  setTitle,
  selectedSubject,
  setSelectedSubject,
  isStarting,
  onStart,
  onBack,
}: SetupViewProps): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.setupHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.setupHeaderTitle}>Go Live</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.setupContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Stream Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="What are you teaching today?"
            placeholderTextColor={COLORS.textMuted}
            maxLength={100}
            returnKeyType="done"
          />
        </View>

        {/* Subject picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Subject</Text>
          <View style={styles.subjectGrid}>
            {CANONICAL_SUBJECT_KEYS.map((key) => {
              const meta = SUBJECT_META[key];
              const isSelected = selectedSubject === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.subjectChip,
                    isSelected && { backgroundColor: `${meta.color}33`, borderColor: meta.color },
                  ]}
                  onPress={() => setSelectedSubject(key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.subjectChipIcon}>{meta.icon}</Text>
                  <Text
                    style={[
                      styles.subjectChipLabel,
                      isSelected && { color: meta.color },
                    ]}
                    numberOfLines={1}
                  >
                    {meta.short}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={[styles.startButton, (!title.trim() || isStarting) && styles.startButtonDisabled]}
          onPress={onStart}
          disabled={!title.trim() || isStarting}
          activeOpacity={0.85}
        >
          {isStarting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.startButtonIcon}>🔴</Text>
              <Text style={styles.startButtonText}>Start Streaming</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Live host view ───────────────────────────────────────────────────────────

interface LiveViewProps {
  streamId: string;
  title: string;
  subject: string;
  onEnd: () => void;
}

function LiveView({ streamId, title, subject, onEnd }: LiveViewProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [chatInput, setChatInput] = useState('');
  const subjectMeta = SUBJECT_META[subject as keyof typeof SUBJECT_META] ?? SUBJECT_META.other;

  const handleStreamEnded = useCallback(() => {
    onEnd();
  }, [onEnd]);

  const { messages, viewerCount, sendChat } = useLiveSocket({
    streamId,
    onStreamEnded: handleStreamEnded,
  });

  const handleSendChat = useCallback(() => {
    if (chatInput.trim()) {
      sendChat(chatInput);
      setChatInput('');
    }
  }, [chatInput, sendChat]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background */}
      <View style={[styles.hostBg, { backgroundColor: `${subjectMeta.color}18` }]}>
        <View style={styles.hostCenter}>
          <Text style={styles.hostSubjectIcon}>{subjectMeta.icon}</Text>
          <Text style={styles.hostTitleText} numberOfLines={2}>{title}</Text>
          <Text style={styles.hostSubjectLabel}>{subjectMeta.label}</Text>
        </View>
      </View>

      {/* Top bar */}
      <View style={[styles.hostTopBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <ViewerCount count={viewerCount} />
      </View>

      {/* Chat area */}
      <View style={[styles.hostChatArea, { paddingBottom: insets.bottom }]}>
        <LiveChat messages={messages} />

        {/* Chat input */}
        <View style={styles.hostInputBar}>
          <TextInput
            style={styles.hostChatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Chat with viewers..."
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="send"
            onSubmitEditing={handleSendChat}
            blurOnSubmit={false}
            maxLength={200}
          />
          <TouchableOpacity
            style={[styles.sendButton, !chatInput.trim() && styles.sendButtonDisabled]}
            onPress={handleSendChat}
            disabled={!chatInput.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>

        {/* Stream controls */}
        <View style={styles.controlsWrapper}>
          <StreamControls streamId={streamId} onEndStream={onEnd} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function LiveHostScreen(): React.ReactElement {
  const navigation = useNavigation<LiveHostNavProp>();

  const [phase, setPhase] = useState<HostPhase>('setup');
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);

  // Setup form state
  const [title, setTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('other');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartStream = useCallback(async () => {
    if (!title.trim()) return;
    setIsStarting(true);
    try {
      const stream = await createStream({
        title: title.trim(),
        subject: selectedSubject !== 'other' ? selectedSubject : null,
        category: 'lecture' as StreamCategory,
        is_public: true,
        allow_comments: true,
        allow_reactions: true,
      });

      if (stream.id) {
        await startStream(stream.id);
        setActiveStreamId(stream.id);
        setPhase('live');
      }
    } catch {
      Alert.alert('Error', 'Could not start stream. Please try again.');
    } finally {
      setIsStarting(false);
    }
  }, [title, selectedSubject]);

  const handleEndStream = useCallback(async () => {
    if (activeStreamId) {
      try {
        await endStream(activeStreamId);
      } catch {
        // Best-effort
      }
    }
    navigation.goBack();
  }, [activeStreamId, navigation]);

  if (phase === 'live' && activeStreamId) {
    return (
      <LiveView
        streamId={activeStreamId}
        title={title}
        subject={selectedSubject}
        onEnd={handleEndStream}
      />
    );
  }

  return (
    <SetupView
      title={title}
      setTitle={setTitle}
      selectedSubject={selectedSubject}
      setSelectedSubject={setSelectedSubject}
      isStarting={isStarting}
      onStart={handleStartStream}
      onBack={() => navigation.goBack()}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Setup header
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  backText: {
    color: COLORS.violet[400],
    fontSize: TYPOGRAPHY.fontSize.base,
    width: 60,
  },
  setupHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },

  // Setup content
  setupContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING['2xl'],
    gap: SPACING['2xl'],
  },

  inputGroup: {
    gap: SPACING.sm,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
    letterSpacing: 0.3,
  },
  titleInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
  },

  // Subject grid
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subjectChipIcon: {
    fontSize: 14,
  },
  subjectChipLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },

  // Start button
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    ...SHADOWS.md,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonIcon: {
    fontSize: 18,
  },
  startButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },

  // Live host view
  hostBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostCenter: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: 32,
    marginBottom: 200, // shift up to make room for chat
  },
  hostSubjectIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  hostTitleText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    textAlign: 'center',
  },
  hostSubjectLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: TYPOGRAPHY.fontSize.base,
    textAlign: 'center',
  },

  // Host top bar
  hostTopBar: {
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

  // Host chat area
  hostChatArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'transparent',
  },
  hostInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  hostChatInput: {
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
  controlsWrapper: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
});
