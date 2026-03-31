import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StoryProgressBar, ProgressState } from '@/features/stories/components/StoryProgressBar';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/shared/constants/theme';
import { StoryType } from '@/shared/types/story';
import type { StoryResponse, StoryGroup } from '@/shared/types/story';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STORY_DURATION_MS = 5000;

const TEXT_GRADIENTS: [string, string][] = [
  ['#7c3aed', '#4f46e5'],
  ['#0f766e', '#15803d'],
  ['#b45309', '#c2410c'],
  ['#9f1239', '#be185d'],
  ['#1d4ed8', '#0369a1'],
  ['#6d28d9', '#7c3aed'],
];

function getGradient(background_color: string | null, storyId: string | null): [string, string] {
  if (background_color) {
    // If it's one of our preset hex codes just use a matching pair
    const found = TEXT_GRADIENTS.find(([a]) => a === background_color);
    if (found) return found;
    return [background_color, background_color];
  }
  // Derive deterministically from storyId
  const idx = storyId ? (storyId.charCodeAt(0) || 0) % TEXT_GRADIENTS.length : 0;
  return TEXT_GRADIENTS[idx];
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export interface StoryViewerProps {
  group: StoryGroup;
  initialStoryIndex?: number;
  onComplete: () => void;
  onClose: () => void;
  onPrevGroup?: () => void;
  onNextGroup?: () => void;
}

export function StoryViewer({
  group,
  initialStoryIndex = 0,
  onComplete,
  onClose,
  onPrevGroup,
  onNextGroup,
}: StoryViewerProps): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stories = group.stories;
  const story: StoryResponse | undefined = stories[currentIndex];

  // ─── Navigation helpers ────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete();
    }
  }, [currentIndex, stories.length, onComplete]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      onPrevGroup?.();
    }
  }, [currentIndex, onPrevGroup]);

  // Reset to initial index when group changes
  useEffect(() => {
    setCurrentIndex(initialStoryIndex);
  }, [group.user_id, initialStoryIndex]);

  // ─── Touch handling ────────────────────────────────────────────────────────
  // Use refs for callbacks so PanResponder always calls the latest version
  const goNextRef = useRef(goNext);
  const goPrevRef = useRef(goPrev);
  const onNextGroupRef = useRef(onNextGroup);
  const onPrevGroupRef = useRef(onPrevGroup);
  useEffect(() => {
    goNextRef.current = goNext;
    goPrevRef.current = goPrev;
    onNextGroupRef.current = onNextGroup;
    onPrevGroupRef.current = onPrevGroup;
  }, [goNext, goPrev, onNextGroup, onPrevGroup]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gs: PanResponderGestureState) => {
        return Math.abs(gs.dx) > 10;
      },
      onPanResponderGrant: () => {
        holdTimerRef.current = setTimeout(() => {
          setIsPaused(true);
        }, 200);
      },
      onPanResponderRelease: (e: GestureResponderEvent, gs: PanResponderGestureState) => {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        setIsPaused(false);

        const { dx, dy } = gs;

        // Horizontal swipe → change group
        if (Math.abs(dx) > 50) {
          if (dx < 0) onNextGroupRef.current?.();
          else onPrevGroupRef.current?.();
          return;
        }

        // Tap — left 30% = previous, right 70% = next
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
          const tapX = e.nativeEvent.locationX;
          if (tapX < SCREEN_WIDTH * 0.3) {
            goPrevRef.current();
          } else {
            goNextRef.current();
          }
        }
      },
      onPanResponderTerminate: () => {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        setIsPaused(false);
      },
    }),
  ).current;

  if (!story) {
    return <View style={styles.container} />;
  }

  // ─── Progress bar states ───────────────────────────────────────────────────
  function getBarState(idx: number): ProgressState {
    if (idx < currentIndex) return 'completed';
    if (idx === currentIndex) return isPaused ? 'upcoming' : 'active';
    return 'upcoming';
  }

  // ─── Content rendering ─────────────────────────────────────────────────────
  function renderContent() {
    switch (story!.story_type) {
      case StoryType.TEXT: {
        const [colorA, colorB] = getGradient(story!.background_color, story!.id);
        return (
          <LinearGradient
            colors={[colorA, colorB]}
            style={styles.textGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.storyText}>{story!.content}</Text>
          </LinearGradient>
        );
      }

      case StoryType.ACHIEVEMENT: {
        const [achColorA, achColorB] = getGradient(story!.background_color, story!.id);
        return (
          <LinearGradient
            colors={[achColorA, achColorB]}
            style={styles.achievementContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="trophy" size={64} color="rgba(255,255,255,0.9)" style={{ marginBottom: 16 }} />
            <Text style={styles.achievementLabel}>Achievement Unlocked</Text>
            {story!.content ? (
              <Text style={styles.achievementContent}>{story!.content}</Text>
            ) : story!.achievement_title ? (
              <Text style={styles.achievementContent}>{story!.achievement_title}</Text>
            ) : null}
            <Text style={styles.watermark}>ariel.study</Text>
          </LinearGradient>
        );
      }

      case StoryType.DECK_POST:
        return (
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              {story!.deck_title ? (
                <Text style={styles.cardDeckTitle}>{story!.deck_title}</Text>
              ) : null}
              <Text style={styles.cardQuestion}>{story!.content}</Text>
              {story!.deck_subject ? (
                <View style={styles.cardSubjectBadge}>
                  <Text style={styles.cardSubjectText}>{story!.deck_subject}</Text>
                </View>
              ) : null}
            </View>
          </View>
        );

      case StoryType.STREAK:
        return (
          <View style={styles.achievementContainer}>
            <Text style={styles.achievementEmoji}>🔥</Text>
            <Text style={styles.achievementTitle}>
              {story!.streak_count != null
                ? `${story!.streak_count} Day Streak!`
                : 'Streak Milestone'}
            </Text>
            {story!.content ? (
              <Text style={styles.achievementDescription}>{story!.content}</Text>
            ) : null}
          </View>
        );

      case StoryType.STUDY_SESSION:
        return (
          <View style={styles.achievementContainer}>
            <Text style={styles.achievementEmoji}>📚</Text>
            {story!.cards_reviewed != null && (
              <Text style={styles.achievementTitle}>
                {story!.cards_reviewed} Cards Reviewed
              </Text>
            )}
            {story!.time_spent_minutes != null && (
              <Text style={styles.achievementDescription}>
                {story!.time_spent_minutes} minutes studied
              </Text>
            )}
            {story!.content ? (
              <Text style={styles.achievementDescription}>{story!.content}</Text>
            ) : null}
          </View>
        );

      default:
        // Fallback: image or text
        if (story!.image_url) {
          return (
            <Image
              source={{ uri: story!.image_url }}
              style={styles.fullImage}
              resizeMode="cover"
            />
          );
        }
        const [colorA, colorB] = getGradient(story!.background_color, story!.id);
        return (
          <LinearGradient
            colors={[colorA, colorB]}
            style={styles.textGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.storyText}>{story!.content}</Text>
          </LinearGradient>
        );
    }
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Story content fills the screen */}
      {renderContent()}

      {/* Top overlay: progress bars + header */}
      <View style={styles.topOverlay} pointerEvents="box-none">
        {/* Progress bars row */}
        <View style={styles.progressRow}>
          {stories.map((s, idx) => (
            <View key={s.id ?? idx} style={styles.progressSegment}>
              <StoryProgressBar
                state={getBarState(idx)}
                duration={isPaused ? 0 : STORY_DURATION_MS}
                onComplete={idx === currentIndex ? goNext : undefined}
              />
            </View>
          ))}
        </View>

        {/* Header row */}
        <View style={styles.header} pointerEvents="box-none">
          {/* Avatar */}
          {group.profile_picture ? (
            <Image
              source={{ uri: group.profile_picture }}
              style={styles.headerAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarInitial}>
                {(group.username ?? group.full_name ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Username + time */}
          <View style={styles.headerInfo}>
            <Text style={styles.headerUsername}>
              {group.username ?? group.full_name ?? 'Unknown'}
            </Text>
            <Text style={styles.headerTime}>{timeAgo(story.created_at)}</Text>
          </View>

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ── Progress ──────────────────────────────────────────────────────────────
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 52, // safe area approximation (screens pass SafeAreaView above)
    paddingHorizontal: SPACING.sm,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: SPACING.sm,
  },
  progressSegment: {
    flex: 1,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.violet[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  headerUsername: {
    color: '#fff',
    fontWeight: '600',
    fontSize: TYPOGRAPHY.fontSize.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: TYPOGRAPHY.fontSize.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: SPACING.xs,
  },

  // ── Text story ────────────────────────────────────────────────────────────
  textGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  storyText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize['3xl'] * 1.3,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // ── Achievement / Streak / Study story ───────────────────────────────────
  achievementContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  achievementLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  achievementContent: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 38,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  watermark: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // ── Card / Deck Post story ────────────────────────────────────────────────
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
    paddingHorizontal: SPACING.xl,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING['2xl'],
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    alignItems: 'center',
  },
  cardDeckTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.violet[600],
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardQuestion: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: '#09090b',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.xl * 1.4,
  },
  cardSubjectBadge: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface2,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  cardSubjectText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // ── Image story ───────────────────────────────────────────────────────────
  fullImage: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
