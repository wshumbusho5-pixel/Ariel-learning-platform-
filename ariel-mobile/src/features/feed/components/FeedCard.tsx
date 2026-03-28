import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

// Resolve relative profile picture URLs to full URLs
function resolveUri(uri?: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  return `${API_BASE}${uri}`;
}
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
// Display name for bot/seeded cards with no author — subject-based pen names
const BOT_NAMES: Record<string, string> = {
  mathematics: 'Prof. Euler',
  sciences: 'Dr. Curie',
  technology: 'Ada Lovelace',
  history: 'Prof. Herodotus',
  literature: 'Jane Austen',
  economics: 'Prof. Keynes',
  languages: 'Dr. Chomsky',
  health: 'Dr. Nightingale',
  psychology: 'Dr. Jung',
  geography: 'Dr. Mercator',
  gospel: 'Rev. Lewis',
  business: 'Prof. Drucker',
  law: 'Justice Holmes',
  arts: 'Prof. Da Vinci',
  engineering: 'Dr. Tesla',
  other: 'Ariel AI',
};

function getBotName(subject?: string | null): string {
  if (!subject) return 'Ariel AI';
  const key = subject.toLowerCase().trim();
  // Direct match
  if (BOT_NAMES[key]) return BOT_NAMES[key];
  // Partial match
  for (const [k, v] of Object.entries(BOT_NAMES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return 'Ariel AI';
}

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
  fullName,
  subjectColor,
}: {
  uri?: string | null;
  username?: string | null;
  fullName?: string | null;
  subjectColor: string;
}) {
  const [err, setErr] = useState(false);
  const resolved = resolveUri(uri);
  const letter = (username ?? fullName ?? 'U').charAt(0).toUpperCase();
  if (resolved && !err) {
    return (
      <Image
        source={{ uri: resolved }}
        style={s.authorAvatar}
        contentFit="cover"
        cachePolicy="memory-disk"
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
  const resolved = resolveUri(user?.profile_picture);
  const letter = (user?.username ?? user?.full_name ?? 'Y').charAt(0).toUpperCase();
  if (resolved && !err) {
    return <Image source={{ uri: resolved }} style={s.meAvatar} contentFit="cover" cachePolicy="memory-disk" onError={() => setErr(true)} />;
  }
  return (
    <View style={[s.meAvatar, s.meAvatarFallback]}>
      <Text style={s.meAvatarText}>{letter}</Text>
    </View>
  );
}

// ─── Comment row ──────────────────────────────────────────────────────────────

function CommentRow({ comment, likedComments, onLike, onReply }: {
  comment: CommentWithAuthor;
  likedComments: Record<string, boolean>;
  onLike: (id: string) => void;
  onReply: (username: string) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const resolvedUri = resolveUri(comment.author_profile_picture);
  const username = comment.author_username ?? 'user';
  const isLiked = likedComments[comment.id] ?? comment.is_liked_by_current_user;

  return (
    <View style={s.commentRow}>
      {/* Avatar */}
      <View style={s.commentAvatar}>
        {resolvedUri && !imgErr ? (
          <Image source={{ uri: resolvedUri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" onError={() => setImgErr(true)} />
        ) : (
          <Text style={s.commentAvatarLetter}>{username.charAt(0).toUpperCase()}</Text>
        )}
      </View>

      {/* Username + text */}
      <View style={s.commentContent}>
        <TouchableOpacity onPress={() => onReply(username)} activeOpacity={0.6}>
          <Text style={s.commentUsername}>{username}</Text>
        </TouchableOpacity>
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const { liked, saved, likeCount, saveCount, handleLike, handleSave, likeAnim } =
    useCardActions({
      cardId,
      initialLikes: card.likes,
      initialSaves: card.saves,
      initialLiked: card.is_liked_by_current_user,
      initialSaved: card.is_saved_by_current_user,
    });

  // Reanimated 3 animated style for the heart icon spring bounce
  const likeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeAnim.value }],
  }));

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
    setReplyingTo(null);
    await postComment(text);
  }, [commentText, postComment]);

  const handleCommentLike = useCallback((commentId: string) => {
    setLikedComments((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  }, []);

  const handleStartReply = useCallback((username: string) => {
    setReplyingTo(username);
    setCommentText(`@${username} `);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);
  const activeText = flipped ? (card.answer ?? '') : card.question;
  const fontSize = cardFontSize(activeText);

  // Footer border color on warm white card
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
            fullName={card.author_full_name}
            subjectColor={subjectColor}
          />
        </View>

        {/* Right column — everything */}
        <View style={s.rightCol}>

          {/* Author meta row */}
          <View style={s.authorRow}>
            <Text style={s.authorMeta} numberOfLines={1}>
              <Text style={s.authorUsername}>
                {card.author_username ?? card.author_full_name ?? getBotName(card.subject)}
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

          {/* ── Card face — Twitter media-frame style ── */}
          <TouchableOpacity
            activeOpacity={0.97}
            onPress={() => setFlipped((f) => !f)}
            style={s.cardFrame}
          >
            {/* Inner inset shadow overlay — darkens edges for recessed look */}
            <View style={s.cardInsetTop} />
            <View style={s.cardInsetBottom} />

            {/* Left subject accent strip */}
            <View style={[s.accentStrip, { backgroundColor: flipped ? '#8b5cf6' : subjectColor }]} />

            {/* Card content */}
            <View style={s.cardContent}>
              {/* Top row: label + subject chip */}
              <View style={s.cardTopRow}>
                <Text style={[s.cardLabel, { color: flipped ? '#a78bfa' : subjectColor }]}>
                  {flipped ? 'Answer' : 'Question'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name={meta.icon as any} size={10} color="#a1a1aa" />
                  <Text style={s.subjectChip}>{meta.short}</Text>
                </View>
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
                {(card as any).community_reviews != null && (card as any).community_reviews > 0 ? (
                  <Text style={s.cardFooterStats}>
                    {(card as any).community_reviews} studied · {(card as any).community_pct_correct}% correct
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
              <Animated.View style={likeAnimStyle}>
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={19}
                  color={liked ? '#f91880' : '#71767b'}
                />
              </Animated.View>
              {likeCount > 0 && (
                <Text style={[s.actionCount, liked && { color: '#f91880' }]}>{likeCount}</Text>
              )}
            </TouchableOpacity>

            {/* Comment */}
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => inputRef.current?.focus()}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#71767b" />
              {comments.length > 0 && (
                <Text style={s.actionCount}>{comments.length}</Text>
              )}
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity style={s.actionBtn} onPress={handleShare} activeOpacity={0.7}>
              <Ionicons name="paper-plane-outline" size={18} color="#71767b" />
            </TouchableOpacity>

            {/* Views */}
            <View style={s.actionBtn}>
              <Ionicons name="eye-outline" size={17} color="#71767b" />
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
                    onReply={handleStartReply}
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
          {replyingTo && (
            <View style={s.replyBanner}>
              <Text style={s.replyBannerText}>
                Replying to <Text style={s.replyBannerName}>@{replyingTo}</Text>
              </Text>
              <TouchableOpacity
                onPress={() => { setReplyingTo(null); setCommentText(''); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={14} color="#52525b" />
              </TouchableOpacity>
            </View>
          )}
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
  dot: { color: '#536471', fontSize: 13 },
  authorSubject: { color: '#71767b', fontSize: 13 },
  authorTime: { color: '#71767b', fontSize: 13 },

  // Caption
  caption: {
    color: '#e7e9ea',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 4,
  },
  mention: { color: '#8b5cf6', fontWeight: '500' },

  // ── Card frame — Twitter media-frame: recessed, frosted, inset shadow ─────
  cardFrame: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 120,
    // Frosted glass — semi-transparent warm white so dark feed shows at edges
    backgroundColor: 'rgba(250,248,245,0.95)',
    // Thin visible border like Twitter video frames
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    // Outer glow — glass catching light
    shadowColor: 'rgba(255,255,255,0.15)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 2,
  },

  // Inset shadow overlays — darken top/bottom edges for recessed depth
  cardInsetTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.04)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  cardInsetBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.03)',
    zIndex: 1,
    pointerEvents: 'none',
  },

  // Left accent strip
  accentStrip: {
    width: 3,
    alignSelf: 'stretch',
    zIndex: 2,
  },

  // Card content area
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'column',
    zIndex: 2,
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

  // Main text — dark on warm white
  cardBody: {
    paddingVertical: 8,
  },
  cardText: {
    fontWeight: '700',
    color: '#18181b',
  },
  cardTextFlipped: {
    color: '#2e1065',
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
    color: '#71767b',
    fontSize: 13,
  },
  actionCountDim: {
    color: '#71767b',
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
    backgroundColor: '#16181c',
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
    color: '#71767b',
    fontSize: 10,
    fontWeight: '600',
  },
  viewAll: {
    color: '#1d9bf0',
    fontSize: 13,
  },

  // ── Reply banner ───────────────────────────────────────────────────────────
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 2,
  },
  replyBannerText: {
    fontSize: 12,
    color: '#71717a',
  },
  replyBannerName: {
    color: '#a78bfa',
    fontWeight: '600',
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
    backgroundColor: '#16181c',
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
