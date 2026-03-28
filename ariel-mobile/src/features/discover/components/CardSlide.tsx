import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SUBJECT_META } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import type { TrendingCard } from '@/features/discover/api/discoverApi';
import apiClient from '@/shared/api/client';
import { CARDS, SOCIAL } from '@/shared/api/endpoints';
import { ActionBtn } from './ActionBtn';

// ─── Responsive helpers ───────────────────────────────────────────────────────

/** True if the device has a short screen (e.g., iPhone SE / 12 mini) */
function useIsShort() {
  const { height } = useWindowDimensions();
  return height < 720;
}

// ─── Single full-screen card slide ───────────────────────────────────────────

export interface CardSlideProps {
  card: TrendingCard;
  subjectKey: SubjectKey;
  isFirst: boolean;
  totalCount: number;
  index: number;
}

export function CardSlide({
  card,
  subjectKey,
  isFirst,
  totalCount,
  index,
}: CardSlideProps) {
  const insets = useSafeAreaInsets();
  const { height: SCREEN_H, width: SCREEN_W } = useWindowDimensions();
  const isShort = SCREEN_H < 720;
  const meta = SUBJECT_META[subjectKey];

  const [flipped, setFlipped] = useState(false);
  const [liked, setLiked] = useState(card.is_liked_by_current_user ?? false);
  const [saved, setSaved] = useState(card.is_saved_by_current_user ?? false);
  const [likeCount, setLikeCount] = useState(card.likes ?? 0);
  const [following, setFollowing] = useState(false);

  // Font size scales with text length AND screen height
  const textLen = flipped ? (card.answer ?? '').length : card.question.length;
  const baseFontSize = textLen > 140 ? 18 : textLen > 80 ? 22 : 28;
  const fontSize = isShort ? Math.max(baseFontSize - 3, 16) : baseFontSize;

  // Spacing compresses on short screens
  const sp = isShort ? 8 : 14;

  // Header height: safe-area top + 44px back-button row
  const headerH = insets.top + 44;
  // Bottom zone: safe-area bottom + author/scroll hint row
  const bottomH = insets.bottom + (isShort ? 72 : 88);
  // Action button size
  const iconSize = isShort ? 24 : 28;
  const actionGap = isShort ? 16 : 22;

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try { await apiClient.post(CARDS.like(card.id!)); }
    catch { setLiked(wasLiked); setLikeCount((c) => c + (wasLiked ? 1 : -1)); }
  };

  const handleSave = async () => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    try { await apiClient.post(CARDS.save(card.id!)); }
    catch { setSaved(wasSaved); }
  };

  const handleShare = async () => {
    try { await Share.share({ message: `${card.question}\n\nLearn on Ariel` }); } catch {}
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => setFlipped((f) => !f)}
      style={[styles.slide, { height: SCREEN_H, width: SCREEN_W }]}
    >
      {/* Subtle subject color tint */}
      <View style={[styles.bgTint, { backgroundColor: meta.color + '08' }]} />

      {/* ── Inner layout using flex, not absolute positions ── */}
      <View style={[styles.inner, { paddingTop: headerH, paddingBottom: bottomH }]}>

        {/* Subject + progress row */}
        <View style={[styles.metaRow, { marginBottom: sp }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 5 }}>
            <Ionicons name={meta.icon as any} size={11} color={meta.color} />
            <Text style={[styles.subjectName, { color: meta.color }]} numberOfLines={1}>
              {meta.label.toUpperCase()}
            </Text>
            {card.topic ? (
              <Text style={styles.topicName} numberOfLines={1}>{'  ·  '}{card.topic.toUpperCase()}</Text>
            ) : null}
          </View>
          <Text style={styles.progress}>{index + 1}/{totalCount}</Text>
        </View>

        {/* ── Card content — takes all remaining space ── */}
        <View style={styles.contentArea}>
          {flipped ? (
            <View style={[styles.textBlock, { gap: sp }]}>
              <Text style={[styles.answerLabel, { color: meta.color }]}>ANSWER</Text>
              <Text style={[styles.cardText, { fontSize, lineHeight: fontSize * 1.42, color: '#f4f4f5' }]}>
                {card.answer ?? 'No answer provided.'}
              </Text>
              {card.explanation && !isShort ? (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationLabel}>Why</Text>
                  <Text style={styles.explanationText} numberOfLines={4}>{card.explanation}</Text>
                </View>
              ) : card.explanation && isShort ? (
                <Text style={styles.explanationInline} numberOfLines={3}>{card.explanation}</Text>
              ) : null}
              <Text style={styles.tapHint}>tap to see question ↺</Text>
            </View>
          ) : (
            <View style={[styles.textBlock, { gap: sp }]}>
              <Text style={[styles.cardText, { fontSize, lineHeight: fontSize * 1.42, color: '#ffffff' }]}>
                {card.question}
              </Text>
              <View style={styles.revealHint}>
                <View style={styles.revealDot} />
                <Text style={styles.tapHint}>tap to reveal</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Bottom row: author left, actions right ── */}
        <View style={[styles.bottomRow, { gap: 12 }]}>
          {/* Author */}
          <View style={styles.authorInfo}>
            <View style={[styles.avatar, isShort && styles.avatarSmall]}>
              <Text style={[styles.avatarLetter, isShort && { fontSize: 12 }]}>
                {(card.author_username ?? 'A').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.authorNameRow}>
                <Text style={[styles.authorName, isShort && { fontSize: 13 }]} numberOfLines={1}>
                  {card.author_username ?? 'Ariel'}
                </Text>
                {card.author_is_verified && (
                  <Ionicons name="checkmark-circle" size={13} color="#60a5fa" style={{ marginLeft: 3 }} />
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {}}
              style={[styles.followBtn, following && styles.followingBtn, isShort && { paddingHorizontal: 10, paddingVertical: 4 }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.followText, following && styles.followingText, isShort && { fontSize: 11 }]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Actions — horizontal on short screens to save vertical space */}
          <View style={[styles.actions, isShort && styles.actionsHorizontal, { gap: actionGap }]}>
            <ActionBtn icon="heart-outline" iconFilled="heart" active={liked} count={likeCount} color="#f87171" size={iconSize} onPress={handleLike} />
            <ActionBtn icon="bookmark-outline" iconFilled="bookmark" active={saved} color="#a78bfa" size={iconSize} onPress={handleSave} />
            <ActionBtn icon="paper-plane-outline" iconFilled="paper-plane" active={false} size={iconSize} onPress={handleShare} />
          </View>
        </View>

        {/* Scroll hint — only when space allows */}
        {isFirst && totalCount > 1 && (
          <View style={[styles.scrollHint, { marginTop: isShort ? 4 : 8 }]}>
            <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.25)" />
            <Text style={styles.scrollHintText}>Scroll for next</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Slide
  slide: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  bgTint: {
    ...StyleSheet.absoluteFillObject,
  },

  // Flex inner layout — respects safe areas via paddingTop/paddingBottom
  inner: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Subject label + progress counter in one row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectLabel: {
    flex: 1,
    fontSize: 11,
  },
  subjectName: {
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  topicName: {
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    fontWeight: '600',
  },
  progress: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 0,
    marginLeft: 8,
  },

  // Card text area — flex:1 so it fills the middle
  contentArea: {
    flex: 1,
    justifyContent: 'center',
  },
  textBlock: {
    // gap is set dynamically
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  cardText: {
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  explanationBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 4,
  },
  explanationLabel: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  explanationText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 19,
  },
  explanationInline: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    lineHeight: 17,
  },
  revealHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revealDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tapHint: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 12,
  },

  // Bottom row: author + actions side by side
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1c1c1e',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarLetter: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '700',
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    flexShrink: 0,
  },
  followingBtn: {
    borderColor: 'rgba(255,255,255,0.15)',
  },
  followText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  followingText: {
    color: 'rgba(255,255,255,0.35)',
  },

  // Actions column (vertical by default, horizontal on short screens)
  actions: {
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionsHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Scroll hint
  scrollHint: {
    alignItems: 'center',
    gap: 2,
  },
  scrollHintText: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 11,
  },
});
