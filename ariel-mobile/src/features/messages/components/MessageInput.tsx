import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';

// ─── Paper-plane SVG via Text (emoji fallback) or inline ─────────────────────
// Using a Unicode send icon since react-native-vector-icons may not be available

interface MessageInputProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps): React.ReactElement {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 && !disabled && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      await onSend(content);
    } catch {
      // Restore text on failure
      setText(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message..."
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
            // Paper-plane icon via unicode
            <View style={styles.sendIconContainer}>
              {/* Inline SVG path is not directly renderable; use Text with Unicode */}
              <SendIcon active={canSend} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Minimal paper-plane icon using View geometry ────────────────────────────

function SendIcon({ active }: { active: boolean }): React.ReactElement {
  // Unicode paper plane: ✈  (U+2708) or use ➤
  // Using a simple rotated text as fallback
  return (
    <View style={iconStyles.wrapper}>
      <View style={[iconStyles.body, active ? iconStyles.bodyActive : iconStyles.bodyInactive]} />
      <View style={[iconStyles.wing, active ? iconStyles.wingActive : iconStyles.wingInactive]} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 0,
    borderRightWidth: 14,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  bodyActive: {
    borderRightColor: '#ffffff',
  },
  bodyInactive: {
    borderRightColor: COLORS.textMuted,
  },
  wing: {
    position: 'absolute',
    bottom: 3,
    left: 2,
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  wingActive: {
    backgroundColor: '#ffffff',
  },
  wingInactive: {
    backgroundColor: COLORS.textMuted,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.surface2,
  },
  sendIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
