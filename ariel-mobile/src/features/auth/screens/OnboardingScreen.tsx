import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/navigation/RootNavigator';
import { authApi } from '../api/authApi';
import { useAuthStore } from '@/shared/auth/authStore';
import { CANONICAL_SUBJECT_KEYS, SUBJECT_META } from '@/shared/constants/subjects';
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

export function OnboardingScreen({ navigation }: Props): React.ReactElement {
  const [step, setStep] = useState<1 | 2>(1);
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const updateUser = useAuthStore((s) => s.updateUser);

  const toggleSubject = (key: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

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

  const progressPct = `${(step / TOTAL_STEPS) * 100}%`;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressPct as any }]} />
      </View>

      {/* Header row: wordmark + step counter */}
      <View style={styles.headerRow}>
        <ArielWordmark size={22} />
        <Text style={styles.stepCounter}>Step {step} of {TOTAL_STEPS}</Text>
      </View>

      {/* Content */}
      {step === 1 ? (
        <EducationStep
          selected={educationLevel}
          onSelect={setEducationLevel}
        />
      ) : (
        <SubjectStep
          selected={selectedSubjects}
          onToggle={toggleSubject}
        />
      )}

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 20) + 8 },
        ]}
      >
        <View style={styles.footerInner}>
          {/* Back button (step 2 only) */}
          {step === 2 && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep(1)}
              activeOpacity={0.7}
            >
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          {/* N selected label (step 2 only) */}
          {step === 2 && selectedSubjects.length > 0 && (
            <Text style={styles.selectedCount}>
              {selectedSubjects.length} selected
            </Text>
          )}

          <View style={{ flex: 1 }} />

          {/* Continue / Get started */}
          <TouchableOpacity
            style={[
              styles.continueBtn,
              !canContinue && styles.continueBtnDisabled,
            ]}
            onPress={handleNext}
            disabled={!canContinue || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text
                style={[
                  styles.continueBtnText,
                  !canContinue && styles.continueBtnTextDisabled,
                ]}
              >
                {step === 2 ? 'Get started' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Education Step ────────────────────────────────────────────────────────────

function EducationStep({
  selected,
  onSelect,
}: {
  selected: EducationLevel | null;
  onSelect: (v: EducationLevel) => void;
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Where are you learning?</Text>
      <Text style={styles.stepSubtitle}>We'll tune your experience to fit.</Text>

      {/* 2×2 grid */}
      <View style={styles.educationGrid}>
        {EDUCATION_OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.educationCard,
                active ? styles.educationCardActive : styles.educationCardInactive,
              ]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.educationEmoji}>{opt.emoji}</Text>
              <Text
                style={[
                  styles.educationLabel,
                  active && styles.educationLabelActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Subject Step ──────────────────────────────────────────────────────────────

function SubjectStep({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>What do you want to learn?</Text>
        <Text style={styles.stepSubtitle}>Choose at least one. You can change this later.</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.subjectGrid}
        showsVerticalScrollIndicator={false}
      >
        {CANONICAL_SUBJECT_KEYS.map((key) => {
          const meta = SUBJECT_META[key];
          const active = selected.includes(key);
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onToggle(key)}
              activeOpacity={0.8}
              style={[
                styles.subjectCard,
                active ? styles.subjectCardActive : styles.subjectCardInactive,
              ]}
            >
              <Text style={styles.subjectEmoji}>{meta.icon}</Text>
              <Text
                style={[
                  styles.subjectLabel,
                  active && styles.subjectLabelActive,
                ]}
                numberOfLines={2}
              >
                {meta.short ?? meta.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Progress bar at top edge
  progressTrack: {
    height: 2,
    backgroundColor: '#27272a',
    width: '100%',
  },
  progressFill: {
    height: 2,
    backgroundColor: '#7c3aed',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  stepCounter: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '500',
  },

  // Step content
  stepContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fafafa',
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    color: '#71717a',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },

  // Education 2×2 grid
  educationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  educationCard: {
    width: '47%',
    aspectRatio: 1.2,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    justifyContent: 'flex-end',
  },
  educationCardActive: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  educationCardInactive: {
    borderColor: '#27272a',
    backgroundColor: 'transparent',
  },
  educationEmoji: {
    fontSize: 28,
    marginBottom: 10,
  },
  educationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  educationLabelActive: {
    color: '#fafafa',
  },

  // Subject 3-column grid
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 10,
  },
  subjectCard: {
    width: '30%',
    borderRadius: 16,
    borderWidth: 2,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  subjectCardActive: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  subjectCardInactive: {
    borderColor: '#27272a',
    backgroundColor: 'transparent',
  },
  subjectEmoji: {
    fontSize: 22,
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

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
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
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    minWidth: 140,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#27272a',
  },
  continueBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  continueBtnTextDisabled: {
    color: '#52525b',
  },
});
