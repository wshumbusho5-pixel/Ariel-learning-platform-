import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideInLeft,
  SlideOutLeft,
  SlideOutRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../api/authApi';
import { useAuthStore } from '@/shared/auth/authStore';
import { CANONICAL_SUBJECT_KEYS, SUBJECT_META, SubjectKey } from '@/shared/constants/subjects';
import { EducationLevel } from '@/shared/types/user';
import { ArielWordmark } from '@/shared/components/ArielWordmark';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const EDUCATION_OPTIONS: { value: EducationLevel; label: string; emoji: string }[] = [
  { value: EducationLevel.HIGH_SCHOOL,  label: 'High School',  emoji: '🏫' },
  { value: EducationLevel.UNIVERSITY,   label: 'University',   emoji: '🎓' },
  { value: EducationLevel.PROFESSIONAL, label: 'Professional', emoji: '💼' },
  { value: EducationLevel.SELF_STUDY,   label: 'Self Study',   emoji: '📖' },
];

const TOTAL_STEPS = 2;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function OnboardingScreen({ navigation }: Props): React.ReactElement {
  const [step, setStep] = useState<1 | 2>(1);
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const isShort = H < 720;

  const updateUser = useAuthStore((s) => s.updateUser);

  const toggleSubject = useCallback((key: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  }, []);

  const canContinue = step === 1 ? educationLevel !== null : selectedSubjects.length > 0;

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (selectedSubjects.length === 0) return;
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        education_level: educationLevel ?? undefined,
        subjects: selectedSubjects,
        onboarding_completed: true,
      });
      await updateUser(updated);
    } catch {
      Alert.alert('Error', 'Could not save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Animated progress bar */}
      <View style={styles.progressTrack}>
        <AnimatedProgressBar step={step} totalSteps={TOTAL_STEPS} />
      </View>

      {/* Header row */}
      <Animated.View
        entering={FadeIn.duration(600)}
        style={[styles.headerRow, { paddingVertical: isShort ? 10 : 16 }]}
      >
        <ArielWordmark size={22} />
        <Text style={styles.stepCounter}>Step {step} of {TOTAL_STEPS}</Text>
      </Animated.View>

      {/* Step content with enter/exit transitions */}
      {step === 1 ? (
        <Animated.View
          key="step1"
          entering={SlideInLeft.duration(350).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutLeft.duration(250).easing(Easing.in(Easing.cubic))}
          style={{ flex: 1 }}
        >
          <EducationStep
            selected={educationLevel}
            onSelect={setEducationLevel}
            isShort={isShort}
          />
        </Animated.View>
      ) : (
        <Animated.View
          key="step2"
          entering={SlideInRight.duration(350).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutRight.duration(250).easing(Easing.in(Easing.cubic))}
          style={{ flex: 1 }}
        >
          <SubjectStep
            selected={selectedSubjects}
            onToggle={toggleSubject}
            isShort={isShort}
          />
        </Animated.View>
      )}

      {/* Footer */}
      <Animated.View
        entering={FadeIn.delay(400).duration(400)}
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 20) + 8, paddingTop: isShort ? 10 : 16 },
        ]}
      >
        <View style={styles.footerInner}>
          {step === 2 && (
            <Animated.View entering={FadeIn.duration(200)}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep(1)}
                activeOpacity={0.7}
              >
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {step === 2 && selectedSubjects.length > 0 && (
            <Animated.Text
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.selectedCount}
            >
              {selectedSubjects.length} selected
            </Animated.Text>
          )}

          <View style={{ flex: 1 }} />

          <ContinueButton
            label={step === 2 ? 'Get started' : 'Continue'}
            enabled={canContinue}
            loading={saving}
            onPress={handleNext}
          />
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Animated Progress Bar ────────────────────────────────────────────────────

function AnimatedProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  const width = useSharedValue(step / totalSteps);

  React.useEffect(() => {
    width.value = withTiming(step / totalSteps, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [step, totalSteps]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return <Animated.View style={[styles.progressFill, animStyle]} />;
}

// ─── Continue Button (animated enable/disable) ───────────────────────────────

function ContinueButton({
  label,
  enabled,
  loading,
  onPress,
}: {
  label: string;
  enabled: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(enabled ? 1 : 0);

  React.useEffect(() => {
    bgOpacity.value = withTiming(enabled ? 1 : 0, { duration: 250 });
  }, [enabled]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: bgOpacity.value > 0.5 ? '#ffffff' : '#27272a',
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: bgOpacity.value > 0.5 ? '#000000' : '#52525b',
  }));

  return (
    <AnimatedTouchable
      style={[styles.continueBtn, animStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      disabled={!enabled || loading}
      activeOpacity={1}
    >
      {loading ? (
        <ActivityIndicator color="#000" />
      ) : (
        <Animated.Text style={[styles.continueBtnText, textStyle]}>
          {label}
        </Animated.Text>
      )}
    </AnimatedTouchable>
  );
}

// ─── Education Step ────────────────────────────────────────────────────────────

function EducationStep({
  selected,
  onSelect,
  isShort,
}: {
  selected: EducationLevel | null;
  onSelect: (v: EducationLevel) => void;
  isShort: boolean;
}) {
  return (
    <View style={[styles.stepContent, { paddingTop: isShort ? 14 : 28 }]}>
      <Animated.Text
        entering={FadeIn.delay(100).duration(400)}
        style={[styles.stepTitle, { fontSize: isShort ? 18 : 22 }]}
      >
        Where are you learning?
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.delay(200).duration(400)}
        style={styles.stepSubtitle}
      >
        We'll tune your experience to fit.
      </Animated.Text>

      <View style={[styles.educationGrid, { marginTop: isShort ? 12 : 24 }]}>
        {EDUCATION_OPTIONS.map((opt, i) => (
          <EducationCard
            key={opt.value}
            opt={opt}
            active={selected === opt.value}
            onSelect={onSelect}
            isShort={isShort}
            index={i}
          />
        ))}
      </View>
    </View>
  );
}

function EducationCard({
  opt,
  active,
  onSelect,
  isShort,
  index,
}: {
  opt: { value: EducationLevel; label: string; emoji: string };
  active: boolean;
  onSelect: (v: EducationLevel) => void;
  isShort: boolean;
  index: number;
}) {
  const scale = useSharedValue(1);
  const borderAnim = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    borderAnim.value = withSpring(active ? 1 : 0, { damping: 15, stiffness: 200 });
  }, [active]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: borderAnim.value > 0.5 ? '#ffffff' : '#27272a',
    backgroundColor: `rgba(255,255,255,${borderAnim.value * 0.08})`,
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(250 + index * 80).duration(350).springify().damping(18)}
      layout={Layout.springify().damping(18)}
      style={styles.educationCardWrapper}
    >
      <AnimatedTouchable
        style={[
          styles.educationCard,
          { aspectRatio: isShort ? 1.5 : 1.2, padding: isShort ? 12 : 20 },
          cardStyle,
        ]}
        onPress={() => onSelect(opt.value)}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        activeOpacity={1}
      >
        <Text style={[styles.educationEmoji, { fontSize: isShort ? 22 : 28 }]}>
          {opt.emoji}
        </Text>
        <Animated.Text
          style={[
            styles.educationLabel,
            active && styles.educationLabelActive,
          ]}
        >
          {opt.label}
        </Animated.Text>
      </AnimatedTouchable>
    </Animated.View>
  );
}

// ─── Subject Step ──────────────────────────────────────────────────────────────

function SubjectStep({
  selected,
  onToggle,
  isShort,
}: {
  selected: string[];
  onToggle: (key: string) => void;
  isShort?: boolean;
}) {
  return (
    <>
      <View style={[styles.stepContent, { paddingTop: isShort ? 14 : 28 }]}>
        <Animated.Text
          entering={FadeIn.delay(100).duration(400)}
          style={[styles.stepTitle, { fontSize: isShort ? 18 : 22 }]}
        >
          What do you want to learn?
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(200).duration(400)}
          style={styles.stepSubtitle}
        >
          Choose at least one. You can change this later.
        </Animated.Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.subjectGrid}
        showsVerticalScrollIndicator={false}
      >
        {CANONICAL_SUBJECT_KEYS.map((key, i) => (
          <SubjectChip
            key={key}
            subjectKey={key}
            active={selected.includes(key)}
            onToggle={onToggle}
            isShort={isShort}
            index={i}
          />
        ))}
      </ScrollView>
    </>
  );
}

function SubjectChip({
  subjectKey,
  active,
  onToggle,
  isShort,
  index,
}: {
  subjectKey: SubjectKey;
  active: boolean;
  onToggle: (key: string) => void;
  isShort?: boolean;
  index: number;
}) {
  const meta = SUBJECT_META[subjectKey];
  const scale = useSharedValue(1);
  const selected = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    selected.value = withSpring(active ? 1 : 0, { damping: 15, stiffness: 200 });
  }, [active]);

  const chipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: selected.value > 0.5 ? '#ffffff' : '#27272a',
    backgroundColor: `rgba(255,255,255,${selected.value * 0.08})`,
  }));

  // Stagger entrance: 3 columns, so row delay based on Math.floor(index/3)
  const row = Math.floor(index / 3);
  const enterDelay = 150 + row * 50;

  return (
    <Animated.View entering={FadeIn.delay(enterDelay).duration(300)} style={styles.subjectCardWrapper}>
      <AnimatedTouchable
        onPress={() => onToggle(subjectKey)}
        onPressIn={() => { scale.value = withSpring(0.92, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        activeOpacity={1}
        style={[
          styles.subjectCard,
          { padding: isShort ? 10 : 14 },
          chipStyle,
        ]}
      >
        <Ionicons name={meta.icon as any} size={22} color={meta.color} />
        <Text
          style={[
            styles.subjectLabel,
            active && styles.subjectLabelActive,
          ]}
          numberOfLines={2}
        >
          {meta.short ?? meta.label}
        </Text>
      </AnimatedTouchable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },

  progressTrack: {
    height: 2,
    backgroundColor: '#27272a',
    width: '100%',
  },
  progressFill: {
    height: 2,
    backgroundColor: '#7c3aed',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  stepCounter: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '500',
  },

  stepContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  stepTitle: {
    fontWeight: '700',
    color: '#fafafa',
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    color: '#71717a',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 20,
  },

  educationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  educationCardWrapper: {
    width: '47%',
  },
  educationCard: {
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'flex-end',
  },
  educationEmoji: {
    marginBottom: 10,
  },
  educationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  educationLabelActive: {
    color: '#fafafa',
  },

  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 10,
  },
  subjectCardWrapper: {
    width: '30%',
  },
  subjectCard: {
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  subjectLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 14,
  },
  subjectLabelActive: {
    color: '#fafafa',
    fontWeight: '600',
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingHorizontal: 24,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  backBtnText: {
    color: '#d4d4d8',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCount: {
    color: '#8b9099',
    fontSize: 13,
    fontWeight: '600',
  },
  continueBtn: {
    paddingHorizontal: 32,
    paddingVertical: 11,
    borderRadius: 999,
    minWidth: 140,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
