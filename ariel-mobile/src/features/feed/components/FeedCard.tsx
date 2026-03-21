import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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

// Responsive font size — matches web: >130 → 14px, >75 → 17px, else → 22px
function cardFontSize(text: string): number {
  if (text.length > 130) return 14;
  if (text.length > 75)  return 17;
  return 22;
}

function parseMentions(text: string): Array<{ type: 'text' | 'mention'; value: string }> {
  const parts: Array<{ type: 'text' | 'mention'; value: string }> = [];
  const regex = /@[\w]+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex)
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    parts.push({ type: 'mention', value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length)
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  return parts;
}

// ─── Author avatar (left column, 40×40) ───────────────────────────────────────

function AuthorAvatarLeft({
  uri,
  username,
  subjectColor,
}: {
  uri?: string | null;
  username?: string | null;
  subjectColor: string;
}) {
  const [err, setErr] = useState(false);
  const letter = (username ?? '?').charAt(0).toUpperCase();
  if (uri && !err) {
    return (
      <Image
        source={{ uri }}
        style={s.authorAvatar}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <View style={[s.authorAvatar, { backgroundColor: subjectColor + '33' }]}>
      <Text style={[s.authorAvatarLetter, { color: subjectColor }]}>{letter}</Text>
    </View>
  );
}

// ─── Current user avatar (for comment input) ──────────────────────────────────

function MeAvatar() {
  const user = useAuthStore((s) => s.user);
  const [err, setErr] = useState(false);
  const uri = user?.profile_picture;
  const letter = (user?.username ?? user?.full_name ?? 'Y').charAt(0).toUpperCase();
  if (uri && !err) {
    return <Image source={{ uri }} style={s.meAvatar} onError={() => setErr(true)} />;
  }
  return (
    <View style={[s.meAvatar, s.meAvatarFallback]}>
      <Text style={s.meAvatarText}>{letter}</Text>
    </View>
  );
}

// ─── Comment row ──────────────────────────────────────────────────────────────

function CommentRow({ comment, likedComments, onLike }: {
  comment: CommentWithAuthor;
  likedComments: Record<string, boolean>;
  onLike: (id: string) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const uri = comment.author_profile_picture;
  const username = comment.author_username ?? 'user';
  const isLiked = likedComments[comment.id] ?? comment.is_liked_by_current_user;

  return (
    <View style={s.commentRow}>
      {/* Avatar */}
      <View style={s.commentAvatar}>
        {uri && !imgErr ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} onError={() => setImgErr(true)} />
        ) : (
          <Text style={s.commentAvatarLetter}>{username.charAt(0).toUpperCase()}</Text>
        )}
      </View>

      {/* Username + text */}
      <View style={s.commentContent}>
        <Text style={s.commentUsername}>{username}</Text>
        <Text style={s.commentText}>
          {parseMentions(comment.content).map((p, i) =>
            p.type === 'mention'
              ? <Text key={i} style={s.mention}>{p.value}</Text>
              : <Text key={i}>{p.value}</Text>
          )}
        </Text>
      </View>

      {/* Thumbs up + count */}
      <TouchableOpacity style={s.commentLike} onPress={() => onLike(comment.id)} activeOpacity={0.7}>
        <Ionicons
          name={isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
          size={15}
          color={isLiked ? '#a78bfa' : '#52525b'}
        />
        {comment.likes > 0 && (
          <Text style={[s.commentLikeCount, isLiked && { color: '#a78bfa' }]}>
            {comment.likes}
          </Text>
        )}
      </TouchableOpacity>
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
  const meta = SUBJECT_META[subjectKey] ?? SUBJECT_META.other;
  const subjectColor = meta.color;
  const views = seedViews(cardId, card.created_at, card.likes);

  const [flipped, setFlipped] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const inputRef = useRef<TextInput>(null);

  const { liked, saved, likeCount, saveCount, handleLike, handleSave, likeAnim } =
    useCardActions({
      cardId,
      initialLikes: card.likes,
      initialSaves: card.saves,
      initialLiked: card.is_liked_by_current_user,
      initialSaved: card.is_saved_by_current_user,
    });

  const { comments, postComment, postingComment } = useCardComments(cardId);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: card.question });
    } catch {}
  }, [card.question]);

  const handleSendComment = useCallback(async () => {
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText('');
    await postComment(text);
  }, [commentText, postComment]);

  const handleCommentLike = useCallback((commentId: string) => {
    setLikedComments((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  }, []);

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);
  const activeText = flipped ? (card.answer ?? '') : card.question;
  const fontSize = cardFontSize(activeText);

  // Footer border color: transparent when flipped (violet tint), else nearly invisible
  const footerBorderColor = flipped ? 'rgba(139,92,246,0.12)' : 'rgba(0,0,0,0.06)';
  const tapHintColor = flipped ? 'rgba(139,92,246,0.45)' : 'rgba(0,0,0,0.22)';

  return (
    <View style={s.post}>
      {/* ── Twitter layout: avatar LEFT, content RIGHT ── */}
      <View style={s.row}>

        {/* Left column — author avatar */}
        <View style={s.leftCol}>
          <AuthorAvatarLeft
            uri={card.author_profile_picture}
            username={card.author_username}
            subjectColor={subjectColor}
          />
        </View>

        {/* Right column — everything */}
        <View style={s.rightCol}>

          {/* Author meta row */}
          <View style={s.authorRow}>
            <Text style={s.authorMeta} numberOfLines={1}>
              <Text style={s.authorUsername}>
                {card.author_username ?? card.author_full_name ?? 'Ariel User'}
              </Text>
              <Text style={s.dot}> · </Text>
              <Text style={s.authorSubject}>{card.subject ?? meta.short}</Text>
              {!!card.created_at && (
                <>
                  <Text style={s.dot}> · </Text>
                  <Text style={s.authorTime}>{timeAgo(card.created_at)}</Text>
                </>
              )}
            </Text>
          </View>

          {/* Caption */}
          {!!card.caption && (
            <Text style={s.caption}>
              {parseMentions(card.caption).map((p, i) =>
                p.type === 'mention'
                  ? <Text key={i} style={s.mention}>{p.value}</Text>
                  : <Text key={i}>{p.value}</Text>
              )}
            </Text>
          )}

          {/* ── Card face ── */}
          <TouchableOpacity
            activeOpacity={0.97}
            onPress={() => setFlipped((f) => !f)}
            style={s.cardFace}
          >
            {/* Left subject accent strip — 3px, subject color */}
            <View style={[s.accentStrip, { backgroundColor: flipped ? '#8b5cf6' : subjectColor }]} />

            {/* Card content */}
            <View style={s.cardContent}>
              {/* Top row: label + subject chip */}
              <View style={s.cardTopRow}>
                <Text style={[s.cardLabel, { color: flipped ? '#8b5cf6' : subjectColor }]}>
                  {flipped ? 'Answer' : 'Question'}
                </Text>
                <Text style={s.subjectChip}>
                  {meta.icon} {meta.short}
                </Text>
              </View>

              {/* Main text — responsive size */}
              <View style={s.cardBody}>
                <Text
                  style={[
                    s.cardText,
                    { fontSize, lineHeight: fontSize * 1.45 },
                    flipped && s.cardTextFlipped,
                  ]}
                >
                  {flipped ? (card.answer || 'No answer provided.') : card.question}
                </Text>
              </View>

              {/* Footer row */}
              <View style={[s.cardFooter, { borderTopColor: footerBorderColor }]}>
                {card.community_reviews != null && card.community_reviews > 0 ? (
                  <Text style={s.cardFooterStats}>
                    {card.community_reviews} studied · {card.community_pct_correct}% correct
                  </Text>
                ) : <View />}
                <Text style={[s.tapHint, { color: tapHintColor }]}>
                  {flipped ? 'tap to close ↺' : 'tap to reveal →'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* ── Action bar ── */}
          <View style={s.actionBar}>
            {/* Like */}
            <TouchableOpacity style={s.actionBtn} onPress={handleLike} activeOpacity={0.7}>
              <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={19}
                  color={liked ? '#f87171' : '#71717a'}
                />
              </Animated.View>
              {likeCount > 0 && (
                <Text style={[s.actionCount, liked && { color: '#f87171' }]}>{likeCount}</Text>
              )}
            </TouchableOpacity>

            {/* Comment */}
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => inputRef.current?.focus()}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#71717a" />
              {comments.length > 0 && (
                <Text style={s.actionCount}>{comments.length}</Text>
              )}
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity style={s.actionBtn} onPress={handleShare} activeOpacity={0.7}>
              <Ionicons name="paper-plane-outline" size={18} color="#71717a" />
            </TouchableOpacity>

            {/* Views */}
            <View style={s.actionBtn}>
              <Ionicons name="eye-outline" size={17} color="#71717a" />
              <Text style={s.actionCountDim}>{views}</Text>
            </View>

            {/* Save: count then bookmark */}
            <TouchableOpacity style={s.actionBtn} onPress={handleSave} activeOpacity={0.7}>
              {saveCount > 0 && (
                <Text style={[s.actionCountDim, saved && { color: '#a78bfa' }]}>{saveCount}</Text>
              )}
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={19}
                color={saved ? '#a78bfa' : '#71717a'}
              />
            </TouchableOpacity>
          </View>

          {/* ── Comments ── */}
          {comments.length > 0 && (
            <View style={s.commentsBlock}>
              {displayedComments.map((c, i) => (
                <View key={c.id} style={[s.commentWrap, i > 0 && { marginTop: 16 }]}>
                  <CommentRow
                    comment={c}
                    likedComments={likedComments}
                    onLike={handleCommentLike}
                  />
                </View>
              ))}
              {comments.length > 3 && (
                <TouchableOpacity onPress={() => setShowAllComments((v) => !v)} style={{ marginTop: 10 }}>
                  <Text style={s.viewAll}>
                    {showAllComments ? 'Show less' : `View all ${comments.length} replies ↓`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Comment input ── */}
          <View style={s.inputRow}>
            <MeAvatar />
            <View style={s.inputBorder}>
              <TextInput
                ref={inputRef}
                style={s.input}
                placeholder="What's your take…"
                placeholderTextColor="#3f4447"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSendComment}
              />
            </View>
            {commentText.trim().length > 0 && (
              <TouchableOpacity onPress={handleSendComment} disabled={postingComment} activeOpacity={0.7}>
                <Text style={s.postBtn}>{postingComment ? '…' : 'Post'}</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>

      {/* Full-width separator — matches web: -mx-4 h-px background: #2f3336 */}
      <View style={s.separator} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  post: {
    paddingTop: 14,
    paddingHorizontal: 16,
  },

  // Twitter layout
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  leftCol: {
    flexShrink: 0,
    paddingTop: 2,
  },
  rightCol: {
    flex: 1,
    minWidth: 0,
  },

  // Author avatar (40×40 circle)
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarLetter: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Author meta
  authorRow: {
    marginBottom: 6,
  },
  authorMeta: { fontSize: 15 },
  authorUsername: { color: '#e7e9ea', fontWeight: '700', fontSize: 15 },
  dot: { color: '#4a5058', fontSize: 13 },
  authorSubject: { color: '#8b9099', fontSize: 13 },
  authorTime: { color: '#8b9099', fontSize: 13 },

  // Caption
  caption: {
    color: '#e7e9ea',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 4,
  },
  mention: { color: '#8b5cf6', fontWeight: '500' },

  // ── Card face ──────────────────────────────────────────────────────────────
  // Matches web: background rgba(255,255,255,0.96), backdropFilter blur(20px),
  // border 1px solid rgba(0,0,0,0.1), boxShadow with inset glows
  cardFace: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },

  // Left accent strip — 3px, rounded left, subject color (changes when flipped)
  accentStrip: {
    width: 3,
    alignSelf: 'stretch',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },

  // Card content area
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'column',
  },

  // Top row: "Question"/"Answer" label + subject chip
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subjectChip: {
    fontSize: 10,
    fontWeight: '500',
    color: '#a1a1aa',
  },

  // Main text — size injected dynamically
  cardBody: {
    paddingVertical: 8,
  },
  cardText: {
    fontWeight: '700',
    color: '#18181b',   // text-zinc-900
    leadingTrim: 'both' as any,
  },
  cardTextFlipped: {
    color: '#2e1065',   // text-violet-900
  },

  // Footer row: community stats + tap hint
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
  },
  cardFooterStats: {
    color: '#a1a1aa',
    fontSize: 10,
  },
  tapHint: {
    fontSize: 10,
  },

  // ── Action bar ─────────────────────────────────────────────────────────────
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    color: '#8b9099',
    fontSize: 13,
  },
  actionCountDim: {
    color: '#8b9099',
    fontSize: 13,
  },

  // ── Comments ───────────────────────────────────────────────────────────────
  commentsBlock: {
    marginTop: 12,
    paddingTop: 4,
  },
  commentWrap: {},
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#27272a',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarLetter: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '700',
  },
  commentContent: {
    flex: 1,
    minWidth: 0,
  },
  commentUsername: {
    color: '#e7e9ea',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 2,
  },
  commentText: {
    color: '#e7e9ea',
    fontSize: 15,
    lineHeight: 22,
  },
  commentLike: {
    flexShrink: 0,
    alignItems: 'center',
    gap: 2,
    paddingTop: 2,
    minWidth: 28,
  },
  commentLikeCount: {
    color: '#52525b',
    fontSize: 10,
    fontWeight: '600',
  },
  viewAll: {
    color: '#8b9099',
    fontSize: 13,
  },

  // ── Comment input ──────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  meAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    flexShrink: 0,
  },
  meAvatarFallback: {
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meAvatarText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '700',
  },
  inputBorder: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#2f3336',
    paddingBottom: 4,
  },
  input: {
    color: '#e7e9ea',
    fontSize: 15,
    paddingVertical: 0,
    maxHeight: 80,
  },
  postBtn: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
  },

  // Full-bleed separator — matches web: -mx-4 h-px background #2f3336
  separator: {
    height: 1,
    backgroundColor: '#2f3336',
    marginHorizontal: -16,
    marginTop: 12,
  },
});
