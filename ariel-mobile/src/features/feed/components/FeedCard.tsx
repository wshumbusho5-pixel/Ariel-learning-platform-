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
import type { FeedCard as FeedCardType } from '@/features/feed/hooks/useFeed';

// ─── Types ───────────────────────────────────────────────────────────────────

type CardStatus = 'due' | 'new' | 'learning' | 'mastered';

const STATUS_META: Record<CardStatus, { label: string; bg: string; text: string; border: string }> = {
  due:      { label: 'Review',   bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  new:      { label: 'New',      bg: 'rgba(14,165,233,0.15)', text: '#38bdf8', border: 'rgba(14,165,233,0.25)' },
  learning: { label: 'Learning', bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  mastered: { label: 'Mastered', bg: 'rgba(34,197,94,0.15)',  text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCardStatus(card: FeedCardType): CardStatus {
  if (card.review_count === 0) return 'new';
  if (card.interval >= 21) return 'mastered';
  if (card.next_review && new Date(card.next_review) <= new Date()) return 'due';
  return 'learning';
}

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

// Parse @mentions and return text segments
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
          <Text key={i} style={styles.mention}>
            {part.value}
          </Text>
        ) : (
          <Text key={i}>{part.value}</Text>
        ),
      )}
    </Text>
  );
}

function StatusPill({ status }: { status: CardStatus }) {
  const meta = STATUS_META[status];
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        backgroundColor: meta.bg,
        borderColor: meta.border,
      }}
    >
      <Text style={{ color: meta.text, fontSize: 11, fontWeight: '600', letterSpacing: 0.3 }}>
        {meta.label}
      </Text>
    </View>
  );
}

interface CommentRowProps {
  profilePicture?: string | null;
  username?: string | null;
  content: string;
}

function CommentRow({ profilePicture, username, content }: CommentRowProps) {
  const [imgErr, setImgErr] = useState(false);
  const showFallback = !profilePicture || imgErr;

  return (
    <View style={styles.commentRow}>
      {showFallback ? (
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>
            {(username ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri: profilePicture! }}
          style={styles.commentAvatar}
          onError={() => setImgErr(true)}
        />
      )}
      <Text style={styles.commentText} numberOfLines={2}>
        <Text style={styles.commentUsername}>{username ?? 'unknown'} </Text>
        {content}
      </Text>
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
  const status = getCardStatus(card);
  const views = seedViews(cardId, card.created_at, card.likes);

  const [flipped, setFlipped] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
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

  const handleFlip = useCallback(() => {
    setFlipped((prev) => !prev);
  }, []);

  const handleCommentIcon = useCallback(() => {
    setShowCommentInput((prev) => !prev);
    if (!showCommentInput) {
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  }, [showCommentInput]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out this flashcard on Ariel!\n\n${card.question}`,
        title: `${subjectMeta.label} flashcard`,
      });
    } catch {
      // User cancelled share — no-op
    }
  }, [card.question, subjectMeta.label]);

  const handleSendComment = useCallback(async () => {
    if (!commentText.trim()) return;
    await postComment(commentText);
    setCommentText('');
  }, [commentText, postComment]);

  const visibleComments = comments.slice(0, 3);
  const extraComments = comments.length - 3;

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
            <Text style={styles.authorUsername}>
              {card.author_username ?? 'unknown'}
            </Text>
            <Text style={styles.authorDot}> · </Text>
            <Text style={styles.authorSubject}>{subjectMeta.short}</Text>
            <Text style={styles.authorDot}> · </Text>
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
      <TouchableWithoutFeedback onPress={handleFlip} accessible accessibilityRole="button" accessibilityLabel={flipped ? 'Tap to show question' : 'Tap to reveal answer'}>
        <View
          style={[
            styles.cardFace,
            flipped && styles.cardFaceFlipped,
          ]}
        >
          {/* Left accent strip */}
          <View style={styles.accentStrip}>
            <SubjectAccent subjectKey={subjectKey} />
          </View>

          {/* Card content */}
          <View style={styles.cardContent}>
            {/* Top row: QUESTION label + subject tag */}
            <View style={styles.cardTopRow}>
              <Text style={styles.questionLabel}>QUESTION</Text>
              <View style={styles.subjectTag}>
                <Text style={styles.subjectTagIcon}>{subjectMeta.icon}</Text>
                <Text style={styles.subjectTagText}>{subjectMeta.short}</Text>
              </View>
            </View>

            {!flipped ? (
              /* Question side */
              <View style={styles.cardBody}>
                <Text style={styles.questionText}>{card.question}</Text>
                <Text style={styles.tapHint}>tap to reveal →</Text>
              </View>
            ) : (
              /* Answer side */
              <View style={styles.cardBody}>
                <Text style={styles.questionFaded} numberOfLines={2}>
                  {card.question}
                </Text>
                <View style={styles.divider} />
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
        <TouchableOpacity
          onPress={handleLike}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Unlike' : 'Like'}
        >
          <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={22}
              color={liked ? '#a78bfa' : '#71717a'}
            />
          </Animated.View>
          {likeCount > 0 && (
            <Text style={[styles.actionCount, liked && styles.actionCountActive]}>
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          onPress={handleCommentIcon}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel="Comment"
        >
          <Ionicons name="chatbubble-outline" size={21} color="#71717a" />
          {comments.length > 0 && (
            <Text style={styles.actionCount}>{comments.length}</Text>
          )}
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Unsave' : 'Save'}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={21}
            color={saved ? '#a78bfa' : '#71717a'}
          />
          {saveCount > 0 && (
            <Text style={[styles.actionCount, saved && styles.actionCountActive]}>
              {saveCount}
            </Text>
          )}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          onPress={handleShare}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Ionicons name="arrow-up-circle-outline" size={22} color="#71717a" />
        </TouchableOpacity>

        {/* Views (right-aligned) */}
        <View style={styles.viewsContainer}>
          <Ionicons name="eye-outline" size={16} color="#52525b" />
          <Text style={styles.viewsText}>{views}</Text>
        </View>
      </View>

      {/* ── Inline Comments ── */}
      {visibleComments.length > 0 && (
        <View style={styles.commentsSection}>
          {visibleComments.map((comment) => (
            <CommentRow
              key={comment.id}
              profilePicture={comment.author_profile_picture}
              username={comment.author_username}
              content={comment.content}
            />
          ))}
          {extraComments > 0 && (
            <TouchableOpacity onPress={handleCommentIcon}>
              <Text style={styles.viewAllComments}>
                View all {comments.length} comments
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Comment Input ── */}
      {showCommentInput && (
        <View style={styles.commentInputRow}>
          <TextInput
            ref={commentInputRef}
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#52525b"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSendComment}
          />
          <TouchableOpacity
            onPress={handleSendComment}
            disabled={postingComment || !commentText.trim()}
            style={[
              styles.sendBtn,
              (!commentText.trim() || postingComment) && styles.sendBtnDisabled,
            ]}
          >
            <Ionicons
              name="send"
              size={18}
              color={commentText.trim() && !postingComment ? '#a78bfa' : '#3f3f46'}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },

  // Author
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  authorInfo: {
    flex: 1,
  },
  authorMeta: {
    fontSize: 14,
    lineHeight: 20,
  },
  authorUsername: {
    color: '#fafafa',
    fontWeight: '600',
    fontSize: 14,
  },
  authorDot: {
    color: '#52525b',
    fontSize: 14,
  },
  authorSubject: {
    color: '#a1a1aa',
    fontSize: 13,
  },
  authorTime: {
    color: '#71717a',
    fontSize: 13,
  },

  // Caption
  captionContainer: {
    marginBottom: 10,
  },
  caption: {
    color: '#d4d4d8',
    fontSize: 14,
    lineHeight: 21,
  },
  mention: {
    color: '#8b5cf6',
    fontWeight: '500',
  },

  // Card face
  cardFace: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 10,
  },
  cardFaceFlipped: {
    backgroundColor: '#fffbeb',
  },
  accentStrip: {
    // width handled by SubjectAccent (3px)
    alignSelf: 'stretch',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
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
    textTransform: 'uppercase',
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  subjectTagIcon: { fontSize: 12 },
  subjectTagText: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '500',
  },
  cardBody: {
    flex: 1,
  },
  questionText: {
    color: '#1a1a1a',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400',
  },
  tapHint: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  questionFaded: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 8,
  },
  answerLabel: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  answerText: {
    color: '#1a1a1a',
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '500',
  },
  explanationBox: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  explanationText: {
    color: '#78350f',
    fontSize: 13,
    lineHeight: 20,
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  actionCount: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '500',
  },
  actionCountActive: {
    color: '#a78bfa',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  viewsText: {
    color: '#52525b',
    fontSize: 12,
  },

  // Comments
  commentsSection: {
    paddingTop: 8,
    gap: 6,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  commentAvatarText: {
    color: '#fafafa',
    fontSize: 10,
    fontWeight: '700',
  },
  commentText: {
    flex: 1,
    color: '#a1a1aa',
    fontSize: 13,
    lineHeight: 19,
  },
  commentUsername: {
    color: '#d4d4d8',
    fontWeight: '600',
  },
  viewAllComments: {
    color: '#8b5cf6',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginLeft: 32,
  },

  // Comment input
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
    gap: 8,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    color: '#fafafa',
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 100,
    paddingVertical: 0,
  },
  sendBtn: {
    padding: 4,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
