import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import type { MessageWithSender } from '@/shared/types/message';

interface MessageInputProps {
  onSend: (text: string, replyToId?: string) => Promise<void>;
  disabled?: boolean;
  replyTo?: MessageWithSender | null;
  onCancelReply?: () => void;
}

export function MessageInput({
  onSend,
  disabled = false,
  replyTo,
  onCancelReply,
}: MessageInputProps): React.ReactElement {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 && !disabled && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    const content = text.trim();
    const replyId = replyTo?.id;
    setText('');
    onCancelReply?.();
    setSending(true);
    try {
      await onSend(content, replyId);
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Reply preview banner */}
      {replyTo && (
        <View style={styles.replyBanner}>
          <View style={styles.replyBannerLeft}>
            <View style={styles.replyBannerAccent} />
            <View style={styles.replyBannerContent}>
              <Text style={styles.replyBannerAuthor} numberOfLines={1}>
                {replyTo.sender_username ?? 'Unknown'}
              </Text>
              <Text style={styles.replyBannerText} numberOfLines={1}>
                {replyTo.content}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onCancelReply}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color="#71767b" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={replyTo ? 'Reply...' : 'Message...'}
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={2000}
          editable={!disabled && !sending}
          returnKeyType="default"
          blurOnSubmit={false}
        />

        <TouchableOpacity
          style={[styles.sendButton, canSend ? styles.sendButtonActive : styles.sendButtonInactive]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="send" size={18} color={canSend ? '#fff' : COLORS.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#2f3336',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  // Reply banner
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 4,
  },
  replyBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
  },
  replyBannerAccent: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: '#7c3aed',
    marginRight: 8,
  },
  replyBannerContent: {
    flex: 1,
    minWidth: 0,
  },
  replyBannerAuthor: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  replyBannerText: {
    color: '#71767b',
    fontSize: 12,
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: '#16181c',
    borderWidth: 1,
    borderColor: '#2f3336',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    color: '#e7e9ea',
    fontSize: TYPOGRAPHY.fontSize.base,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonActive: {
    backgroundColor: COLORS.violet[600],
  },
  sendButtonInactive: {
    backgroundColor: '#16181c',
  },
});
