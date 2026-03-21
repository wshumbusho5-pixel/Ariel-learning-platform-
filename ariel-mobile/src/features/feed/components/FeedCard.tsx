import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Share,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import { timeAgo } from '@/shared/utils/time';
import { useCardActions } from '@/features/feed/hooks/useCardActions';
import { useCardComments } from '@/features/feed/hooks/useCardComments';
import { SubjectAccent } from '@/features/feed/components/SubjectAccent';
import { AuthorAvatar } from '@/features/feed/components/AuthorAvatar';
import { useAuthStore } from '@/shared/auth/authStore';
import type { FeedCard as FeedCardType } from '@/features/feed/hooks/useFeed';
import type { CommentWithAuthor } from '@/shared/types/comment';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function seedViews(cardId: string, createdAt?: string, likes: number = 0): string {
  let h = 0;
  for (let i = 0; i < cardId.length; i++) {
    h = (Math.imul(31, h) + cardId.charCodeAt(i)) | 0;
  }
  const v = (Math.abs(h) % 1000) / 1000;
  let n: number;
  if (createdAt) {
    const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
    if      (ageDays < 0.04) n = Math.floor(5 + v * 30);
    else if (ageDays < 1)    n = Math.floor(30 + v * 120);
    else if (ageDays < 3)    n = Math.floor(150 + v * 500);
    else if (ageDays < 7)    n = Math.floor(500 + v * 1000);
    else if (ageDays < 30)   n = Math.floor(1200 + v * 1800);
    else                     n = Math.floor(2000 + v * 3000);
  } else {
    n = Math.floor(200 + v * 800);
  }
  n = Math.max(n, likes * 3);
  n = Math.min(n, 5000);
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

function parseMentions(text: string): Array<{ type: 'text' | 'mention'; value: string }> {
  const parts: Array<{ type: 'text' | 'mention'; value: string }> = [];
  const regex = /@[\w]+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'mention', value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return parts;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CaptionText({ caption }: { caption: string }) {
  const parts = parseMentions(caption);
  return (
    <Text style={styles.caption}>
      {parts.map((part, i) =>
        part.type === 'mention' ? (
          <Text key={i} style={styles.mention}>{part.value}</Text>
        ) : (
          <Text key={i}>{part.value}</Text>
        ),
      )}
    </Text>
  );
}

// ─── Comment row (Twitter style) ──────────────────────────────────────────────

function CommentRow({ comment }: { comment: CommentWithAuthor }) {
  const [imgErr, setImgErr] = useState(false);
  const uri = comment.author_profile_picture;
  const username = comment.author_username ?? '?';

  return (
    <View style={styles.commentRow}>
      {/* Left: avatar + username + text */}
      <View style={styles.commentLeft}>
        {uri && !imgErr ? (
          <Image
            source={{ uri }}
            style={styles.commentAvatar}
            onError={() => setImgErr(true)}
          />
        ) : (
          <View style={[styles.commentAvatar, styles.commentAvatarFallback]}>
            <Text style={styles.commentAvatarText}>{username.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.commentText} numberOfLines={3}>
          <Text style={styles.commentUsername}>{username} </Text>
          {comment.content}
        </Text>
      </View>

      {/* Right: thumbs up + likes */}
      <View style={styles.commentLikes}>
        <Ionicons name="thumbs-up-outline" size={13} color="#52525b" />
        {comment.likes > 0 && (
          <Text style={styles.commentLikeCount}>{comment.likes}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Current user mini avatar ─────────────────────────────────────────────────

function MeAvatar() {
  const user = useAuthStore((s) => s.user);
  const [imgErr, setImgErr] = useState(false);
  const uri = user?.profile_picture;
  const letter = (user?.username ?? user?.full_name ?? '?').charAt(0).toUpperCase();

  if (uri && !imgErr) {
    return (
      <Image
        source={{ uri }}
        style={styles.meAvatar}
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <View style={[styles.meAvatar, styles.meAvatarFallback]}>
      <Text style={styles.meAvatarText}>{letter}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface FeedCardProps {
  card: FeedCardType;
}

export function FeedCard({ card }: FeedCardProps) {
  const cardId = card.id ?? '';
  const subjectKey = normalizeSubjectKey(card.subject ?? card.topic) as SubjectKey;
  const subjectMeta = SUBJECT_META[subjectKey] ?? SUBJECT_META.other;
  const views = seedViews(cardId, card.created_at, card.likes);

  const [flipped, setFlipped] = useState(false);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<TextInput>(null);

  const { liked, saved, likeCount, saveCount, handleLike, handleSave, likeAnim } =
    useCardActions({
      cardId,
      initialLikes: card.likes,
      initialSaves: card.saves,
      initialLiked: card.is_liked_by_current_user,
      initialSaved: card.is_saved_by_current_user,
    });

  const { comments, postComment, postingComment } = useCardComments(cardId);

  const handleFlip = useCallback(() => setFlipped((p) => !p), []);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out this flashcard on Ariel!\n\n${card.question}`,
      });
    } catch {}
  }, [card.question]);

  const handleSendComment = useCallback(async () => {
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText('');
    await postComment(text);
  }, [commentText, postComment]);

  const visibleComments = comments.slice(0, 3);
  const extraCount = comments.length - 3;

  return (
    <View style={styles.container}>

      {/* ── Author Row ── */}
      <View style={styles.authorRow}>
        <AuthorAvatar
          size={40}
          username={card.author_username}
          fullName={card.author_full_name}
          profilePicture={card.author_profile_picture}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorMeta} numberOfLines={1}>
            <Text style={styles.authorUsername}>{card.author_username ?? 'unknown'}</Text>
            <Text style={styles.dot}> · </Text>
            <Text style={styles.authorSubject}>{subjectMeta.short}</Text>
            <Text style={styles.dot}> · </Text>
            <Text style={styles.authorTime}>{timeAgo(card.created_at)}</Text>
          </Text>
        </View>
        {card.author_is_verified && (
          <Ionicons name="checkmark-circle" size={16} color="#a78bfa" />
        )}
      </View>

      {/* ── Caption ── */}
      {!!card.caption && (
        <View style={styles.captionContainer}>
          <CaptionText caption={card.caption} />
        </View>
      )}

      {/* ── Card Face ── */}
      <TouchableWithoutFeedback
        onPress={handleFlip}
        accessible
        accessibilityRole="button"
        accessibilityLabel={flipped ? 'Tap to show question' : 'Tap to reveal answer'}
      >
        <View style={[styles.cardFace, flipped && styles.cardFaceFlipped]}>
          {/* Left accent strip */}
          <View style={styles.accentStrip}>
            <SubjectAccent subjectKey={subjectKey} />
          </View>

          {/* Card content */}
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <Text style={styles.questionLabel}>QUESTION</Text>
              <View style={styles.subjectTag}>
                <Text style={styles.subjectTagIcon}>{subjectMeta.icon}</Text>
                <Text style={styles.subjectTagText}>{subjectMeta.short}</Text>
              </View>
            </View>

            {!flipped ? (
              <View style={styles.cardBody}>
                <Text style={styles.questionText}>{card.question}</Text>
                <Text style={styles.tapHint}>tap to reveal →</Text>
              </View>
            ) : (
              <View style={styles.cardBody}>
                <Text style={styles.questionFaded} numberOfLines={2}>{card.question}</Text>
                <View style={styles.dividerLine} />
                <Text style={styles.answerLabel}>ANSWER</Text>
                <Text style={styles.answerText}>{card.answer}</Text>
                {!!card.explanation && (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationText}>{card.explanation}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* ── Action Bar ── */}
      <View style={styles.actionBar}>
        {/* Like */}
        <TouchableOpacity onPress={handleLike} style={styles.actionBtn} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? '#ef4444' : '#71717a'}
            />
          </Animated.View>
          {likeCount > 0 && (
            <Text style={[styles.actionCount, liked && { color: '#ef4444' }]}>
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          onPress={() => commentInputRef.current?.focus()}
          style={styles.actionBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={19} color="#71717a" />
          {comments.length > 0 && (
            <Text style={styles.actionCount}>{comments.length}</Text>
          )}
        </TouchableOpacity>

        {/* Share / repost */}
        <TouchableOpacity onPress={handleShare} style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-redo-outline" size={20} color="#71717a" />
        </TouchableOpacity>

        {/* Views */}
        <View style={styles.actionBtn}>
          <Ionicons name="eye-outline" size={18} color="#52525b" />
          <Text style={styles.actionCountDim}>{views}</Text>
        </View>

        {/* Save count + bookmark — right side */}
        <View style={styles.rightActions}>
          {saveCount > 0 && (
            <Text style={[styles.actionCountDim, saved && { color: '#a78bfa' }]}>
              {saveCount}
            </Text>
          )}
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? '#a78bfa' : '#71717a'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Inline Comments ── */}
      {visibleComments.length > 0 && (
        <View style={styles.commentsBlock}>
          {visibleComments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} />
          ))}
          {extraCount > 0 && (
            <TouchableOpacity onPress={() => commentInputRef.current?.focus()}>
              <Text style={styles.viewAll}>View all {comments.length} comments</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── "What's your take" input (always visible, Twitter style) ── */}
      <View style={styles.inputRow}>
        <MeAvatar />
        <TextInput
          ref={commentInputRef}
          style={styles.twitterInput}
          placeholder="What's your take..."
          placeholderTextColor="#3f3f46"
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSendComment}
        />
        {commentText.trim().length > 0 && (
          <TouchableOpacity
            onPress={handleSendComment}
            disabled={postingComment}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={17}
              color={postingComment ? '#3f3f46' : '#8b5cf6'}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },

  // Author
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  authorInfo: { flex: 1 },
  authorMeta: { fontSize: 14 },
  authorUsername: { color: '#fafafa', fontWeight: '700', fontSize: 14 },
  dot: { color: '#52525b', fontSize: 14 },
  authorSubject: { color: '#a1a1aa', fontSize: 13 },
  authorTime: { color: '#71717a', fontSize: 13 },

  // Caption
  captionContainer: { marginBottom: 10 },
  caption: { color: '#d4d4d8', fontSize: 15, lineHeight: 22 },
  mention: { color: '#8b5cf6', fontWeight: '500' },

  // Card face
  cardFace: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 10,
  },
  cardFaceFlipped: { backgroundColor: '#fffbeb' },
  accentStrip: { alignSelf: 'stretch' },
  cardContent: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  subjectTagIcon: { fontSize: 11 },
  subjectTagText: { color: '#6b7280', fontSize: 11, fontWeight: '500' },
  cardBody: { flex: 1 },
  questionText: {
    color: '#111',
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '700',
  },
  tapHint: {
    color: '#b0b8c8',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  questionFaded: { color: '#9ca3af', fontSize: 13, lineHeight: 19, marginBottom: 8 },
  dividerLine: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 8 },
  answerLabel: { color: '#92400e', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 5 },
  answerText: { color: '#111', fontSize: 18, lineHeight: 27, fontWeight: '500' },
  explanationBox: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  explanationText: { color: '#78350f', fontSize: 13, lineHeight: 20 },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: { color: '#71717a', fontSize: 13, fontWeight: '500' },
  actionCountDim: { color: '#52525b', fontSize: 13 },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
  },

  // Comments block
  commentsBlock: {
    paddingTop: 4,
    paddingBottom: 4,
    gap: 8,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  commentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    flexShrink: 0,
  },
  commentAvatarFallback: {
    backgroundColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { color: '#fafafa', fontSize: 10, fontWeight: '700' },
  commentText: { flex: 1, color: '#a1a1aa', fontSize: 13, lineHeight: 19 },
  commentUsername: { color: '#d4d4d8', fontWeight: '700' },
  commentLikes: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    paddingTop: 2,
    flexShrink: 0,
  },
  commentLikeCount: { color: '#52525b', fontSize: 11 },
  viewAll: {
    color: '#71717a',
    fontSize: 13,
    marginLeft: 36,
    marginTop: 2,
  },

  // Twitter-style input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    marginTop: 4,
  },
  meAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    flexShrink: 0,
  },
  meAvatarFallback: {
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meAvatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  twitterInput: {
    flex: 1,
    color: '#fafafa',
    fontSize: 14,
    paddingVertical: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    maxHeight: 80,
  },
});
