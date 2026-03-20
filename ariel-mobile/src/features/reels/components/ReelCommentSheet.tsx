import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/shared/constants/theme';
import { getReelComments, postReelComment } from '@/features/reels/api/reelsApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

interface Comment {
  id: string;
  content: string;
  author_username: string;
  author_profile_picture: string | null;
  created_at: string;
}

// ─── Comment Row ───────────────────────────────────────────────────────────────

interface CommentRowProps {
  comment: Comment;
}

function CommentRow({ comment }: CommentRowProps) {
  const [imgErr, setImgErr] = useState(false);
  const showFallback = !comment.author_profile_picture || imgErr;

  return (
    <View style={styles.commentRow}>
      {showFallback ? (
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>
            {(comment.author_username[0] ?? '?').toUpperCase()}
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri: comment.author_profile_picture! }}
          style={styles.commentAvatar}
          onError={() => setImgErr(true)}
        />
      )}
      <View style={styles.commentBody}>
        <Text style={styles.commentUsername}>{comment.author_username}</Text>
        <Text style={styles.commentContent} numberOfLines={4}>
          {comment.content}
        </Text>
      </View>
    </View>
  );
}

// ─── Sheet ─────────────────────────────────────────────────────────────────────

interface ReelCommentSheetProps {
  reelId: string;
  visible: boolean;
  onClose: () => void;
}

export function ReelCommentSheet({ reelId, visible, onClose }: ReelCommentSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Fetch comments whenever the sheet becomes visible
  useEffect(() => {
    if (!visible) return;
    setLoadingComments(true);
    getReelComments(reelId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [visible, reelId]);

  // Animate open / close
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handlePost = useCallback(async () => {
    const text = commentText.trim();
    if (!text || posting) return;

    setPosting(true);
    try {
      const newComment = await postReelComment(reelId, text);
      setComments((prev) => [
        {
          id: newComment.id,
          content: newComment.content,
          author_username: newComment.author_username,
          author_profile_picture: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCommentText('');
      Keyboard.dismiss();
    } catch {
      // Silently fail — user sees input still there, can retry
    } finally {
      setPosting(false);
    }
  }, [commentText, posting, reelId]);

  if (!visible) {
    // Keep in tree so Animated.Value is preserved, but render nothing interactive
    return (
      <Animated.View
        style={[styles.sheetContainer, { transform: [{ translateY }] }]}
        pointerEvents="none"
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetInner}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.handleBar} />
            <Text style={styles.sheetTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Comment list */}
          {loadingComments ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : (
            <FlatList<Comment>
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <CommentRow comment={item} />}
              contentContainerStyle={styles.commentList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                </View>
              }
            />
          )}

          {/* Comment input */}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handlePost}
            />
            <TouchableOpacity
              onPress={handlePost}
              disabled={!commentText.trim() || posting}
              style={[styles.sendBtn, (!commentText.trim() || posting) && styles.sendBtnDisabled]}
            >
              <Ionicons
                name="send"
                size={20}
                color={commentText.trim() && !posting ? COLORS.violet[400] : COLORS.border}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    zIndex: 101,
    ...SHADOWS.lg,
  },
  sheetInner: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS['2xl'],
    borderTopRightRadius: BORDER_RADIUS['2xl'],
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    alignItems: 'center',
    flexDirection: 'row',
  },
  handleBar: {
    position: 'absolute',
    top: SPACING.sm,
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    left: '50%',
    marginLeft: -18,
  },
  sheetTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    marginTop: SPACING.sm,
  },
  closeBtn: {
    padding: 4,
    marginTop: SPACING.sm,
  },
  commentList: {
    padding: SPACING.lg,
    gap: SPACING.lg,
    flexGrow: 1,
  },
  commentRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  commentAvatarText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
  },
  commentBody: {
    flex: 1,
  },
  commentUsername: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    marginBottom: 2,
  },
  commentContent: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING['4xl'],
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
