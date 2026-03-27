import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createStory } from '@/features/stories/api/storiesApi';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import { StoryType, StoryVisibility } from '@/shared/types/story';

type NavProp = NativeStackNavigationProp<Record<string, object | undefined>>;

type StoryMode = 'text' | 'achievement';

interface GradientPreset {
  id: string;
  label: string;
  colors: [string, string];
  value: string; // stored as background_color
}

const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'violet', label: 'Violet', colors: ['#7c3aed', '#4f46e5'], value: '#7c3aed' },
  { id: 'teal',   label: 'Teal',   colors: ['#0f766e', '#15803d'], value: '#0f766e' },
  { id: 'amber',  label: 'Amber',  colors: ['#b45309', '#c2410c'], value: '#b45309' },
  { id: 'rose',   label: 'Rose',   colors: ['#9f1239', '#be185d'], value: '#9f1239' },
  { id: 'blue',   label: 'Blue',   colors: ['#1d4ed8', '#0369a1'], value: '#1d4ed8' },
  { id: 'purple', label: 'Purple', colors: ['#6d28d9', '#7c3aed'], value: '#6d28d9' },
];

// Mock achievement interface for UI purposes
interface MockAchievement {
  id: string;
  title: string;
  icon: string;
  description: string;
}

const SAMPLE_ACHIEVEMENTS: MockAchievement[] = [
  { id: 'streak_7',   title: '7-Day Streak',       icon: '🔥', description: 'Studied 7 days in a row' },
  { id: 'streak_30',  title: '30-Day Streak',      icon: '🏆', description: 'Studied 30 days in a row' },
  { id: 'cards_100',  title: '100 Cards Reviewed', icon: '📚', description: 'Reviewed 100 flashcards' },
  { id: 'cards_1000', title: '1000 Cards Reviewed',icon: '🎓', description: 'Reviewed 1000 flashcards' },
  { id: 'first_deck', title: 'Deck Creator',       icon: '✨', description: 'Created your first deck' },
  { id: 'social',     title: 'Social Learner',     icon: '👥', description: 'Followed 5 users' },
];

export function StoryCreateScreen(): React.ReactElement {
  const { height: H } = useWindowDimensions();
  const isShort = H < 720;
  const navigation = useNavigation<NavProp>();

  const [mode, setMode] = useState<StoryMode>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState<GradientPreset>(GRADIENT_PRESETS[0]);
  const [selectedAchievement, setSelectedAchievement] = useState<MockAchievement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canShare =
    mode === 'text'
      ? textContent.trim().length > 0
      : selectedAchievement !== null;

  const handleShare = useCallback(async () => {
    if (!canShare || isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (mode === 'text') {
        await createStory({
          story_type: StoryType.TEXT,
          content: textContent.trim(),
          background_color: selectedGradient.value,
          visibility: StoryVisibility.FOLLOWERS,
        });
      } else if (selectedAchievement) {
        await createStory({
          story_type: StoryType.ACHIEVEMENT,
          content: selectedAchievement.description,
          achievement_id: selectedAchievement.id,
          visibility: StoryVisibility.FOLLOWERS,
        });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to share story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canShare, isSubmitting, mode, textContent, selectedGradient, selectedAchievement, navigation]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, isShort && { paddingVertical: SPACING.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={isShort ? 20 : 24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Story</Text>
        <TouchableOpacity
          onPress={handleShare}
          disabled={!canShare || isSubmitting}
          style={[styles.shareBtn, (!canShare || isSubmitting) && styles.shareBtnDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.shareBtnText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Mode selector */}
      <View style={[styles.modeRow, isShort && { marginVertical: SPACING.sm }]}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'text' && styles.modeTabActive]}
          onPress={() => setMode('text')}
        >
          <Text style={[styles.modeTabText, mode === 'text' && styles.modeTabTextActive]}>
            Text
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'achievement' && styles.modeTabActive]}
          onPress={() => setMode('achievement')}
        >
          <Text style={[styles.modeTabText, mode === 'achievement' && styles.modeTabTextActive]}>
            Achievement
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isShort && { paddingBottom: SPACING['2xl'] }]}
        keyboardShouldPersistTaps="handled"
      >
        {mode === 'text' ? (
          <>
            {/* Preview card */}
            <LinearGradient
              colors={selectedGradient.colors}
              style={[styles.preview, isShort && { height: 160, padding: SPACING.lg, marginBottom: SPACING.md }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.previewText}>
                {textContent.trim() || 'Start typing below…'}
              </Text>
            </LinearGradient>

            {/* Text input */}
            <TextInput
              style={[styles.textInput, isShort && { minHeight: 72, marginBottom: SPACING.md }]}
              placeholder="What's on your mind?"
              placeholderTextColor={COLORS.textMuted}
              value={textContent}
              onChangeText={setTextContent}
              multiline
              maxLength={280}
              autoFocus
            />

            {/* Gradient presets */}
            <Text style={styles.sectionLabel}>Background</Text>
            <View style={styles.gradientRow}>
              {GRADIENT_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => setSelectedGradient(preset)}
                  style={[
                    styles.gradientSwatch,
                    selectedGradient.id === preset.id && styles.gradientSwatchSelected,
                  ]}
                >
                  <LinearGradient
                    colors={preset.colors}
                    style={styles.gradientSwatchInner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Select an Achievement to Share</Text>
            {SAMPLE_ACHIEVEMENTS.map((ach) => {
              const isSelected = selectedAchievement?.id === ach.id;
              return (
                <TouchableOpacity
                  key={ach.id}
                  onPress={() => setSelectedAchievement(isSelected ? null : ach)}
                  style={[styles.achievementRow, isSelected && styles.achievementRowSelected, isShort && { padding: SPACING.md, marginBottom: SPACING.sm }]}
                >
                  <Text style={styles.achievementEmoji}>{ach.icon}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{ach.title}</Text>
                    <Text style={styles.achievementDescription}>{ach.description}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.violet[500]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  shareBtn: {
    backgroundColor: COLORS.violet[600],
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 72,
    alignItems: 'center',
  },
  shareBtnDisabled: {
    opacity: 0.4,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: TYPOGRAPHY.fontSize.sm,
  },

  // ── Mode tabs ─────────────────────────────────────────────────────────────
  modeRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  modeTabActive: {
    backgroundColor: COLORS.violet[700],
  },
  modeTabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  modeTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },

  // ── Text mode ─────────────────────────────────────────────────────────────
  preview: {
    height: 240,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
    marginBottom: SPACING.lg,
  },
  previewText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gradientRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  gradientSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gradientSwatchSelected: {
    borderColor: '#fff',
  },
  gradientSwatchInner: {
    flex: 1,
    borderRadius: 21,
  },

  // ── Achievement mode ──────────────────────────────────────────────────────
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  achievementRowSelected: {
    borderColor: COLORS.violet[500],
    backgroundColor: `${COLORS.violet[950]}44`,
  },
  achievementEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.fontSize.base,
    marginBottom: 2,
  },
  achievementDescription: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
