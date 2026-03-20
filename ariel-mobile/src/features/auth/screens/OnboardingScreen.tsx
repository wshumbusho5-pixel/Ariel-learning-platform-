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

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const EDUCATION_OPTIONS: { value: EducationLevel; label: string; emoji: string }[] = [
  { value: EducationLevel.HIGH_SCHOOL,  label: 'High School',  emoji: '🏫' },
  { value: EducationLevel.UNIVERSITY,   label: 'University',   emoji: '🎓' },
  { value: EducationLevel.PROFESSIONAL, label: 'Professional', emoji: '💼' },
  { value: EducationLevel.SELF_STUDY,   label: 'Self Study',   emoji: '📖' },
];

export function OnboardingScreen({ navigation }: Props): React.ReactElement {
  const [step, setStep] = useState<0 | 1 | 2>(0);
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

  const handleFinish = async () => {
    if (selectedSubjects.length === 0) {
      Alert.alert('Pick at least one subject', 'Choose what you want to study.');
      return;
    }
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

  // ─── Step 0 — Welcome ─────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeEmoji}>🎓</Text>
          <Text style={styles.welcomeTitle}>Welcome to Ariel</Text>
          <Text style={styles.welcomeSubtitle}>
            Learn with flashcards, compete in duels, and grow your knowledge — every day.
          </Text>

          <View style={styles.featureList}>
            <FeatureRow icon="⚡" text="Spaced repetition that actually works" />
            <FeatureRow icon="⚔️" text="Real-time duels against other students" />
            <FeatureRow icon="🃏" text="AI-generated decks on any subject" />
            <FeatureRow icon="🔥" text="Streaks, levels, and achievements" />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { marginHorizontal: 24, marginBottom: insets.bottom + 24 }]}
          onPress={() => setStep(1)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Get started →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Step 1 — Education level ─────────────────────────────────────────────
  if (step === 1) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
        <View style={styles.stepContent}>
          <StepIndicator current={1} total={2} />
          <Text style={styles.stepTitle}>What level are you at?</Text>
          <Text style={styles.stepSubtitle}>We'll tune your experience to fit.</Text>

          <View style={styles.optionList}>
            {EDUCATION_OPTIONS.map((opt) => {
              const active = educationLevel === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionRow,
                    active ? styles.optionRowActive : styles.optionRowInactive,
                  ]}
                  onPress={() => setEducationLevel(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.navRow, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(0)} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 2, paddingHorizontal: 32 }]}
            onPress={() => setStep(2)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Step 2 — Subject selection ───────────────────────────────────────────
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <View style={styles.stepContent}>
        <StepIndicator current={2} total={2} />
        <Text style={styles.stepTitle}>Pick your subjects</Text>
        <Text style={styles.stepSubtitle}>Choose at least one. You can change this later.</Text>
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: 16 }}
        contentContainerStyle={styles.subjectGrid}
        showsVerticalScrollIndicator={false}
      >
        {CANONICAL_SUBJECT_KEYS.map((key) => {
          const meta = SUBJECT_META[key];
          const active = selectedSubjects.includes(key);
          return (
            <TouchableOpacity
              key={key}
              onPress={() => toggleSubject(key)}
              activeOpacity={0.8}
              style={[
                styles.subjectChip,
                {
                  borderColor: active ? meta.color : '#3f3f46',
                  backgroundColor: active ? `${meta.color}20` : '#18181b',
                },
              ]}
            >
              <Text style={{ fontSize: 16 }}>{meta.icon}</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: active ? '600' : '400',
                  color: active ? meta.color : '#a1a1aa',
                }}
              >
                {meta.short}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        {selectedSubjects.length > 0 && (
          <Text style={styles.selectedCount}>{selectedSubjects.length} selected</Text>
        )}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { flex: 2, paddingHorizontal: 32 },
              selectedSubjects.length === 0 && { opacity: 0.5 },
            ]}
            onPress={handleFinish}
            disabled={saving || selectedSubjects.length === 0}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Start learning →</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            { backgroundColor: i + 1 <= current ? '#7c3aed' : '#3f3f46' },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  welcomeEmoji: {
    fontSize: 52,
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fafafa',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontSize: 14,
  },
  featureList: {
    marginTop: 32,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    color: '#a1a1aa',
    fontSize: 14,
    flex: 1,
  },
  stepContent: {
    paddingHorizontal: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  stepDot: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fafafa',
  },
  stepSubtitle: {
    color: '#a1a1aa',
    fontSize: 14,
    marginTop: 8,
  },
  optionList: {
    marginTop: 24,
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionRowActive: {
    borderColor: '#7c3aed',
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  optionRowInactive: {
    borderColor: '#3f3f46',
    backgroundColor: '#18181b',
  },
  optionEmoji: {
    fontSize: 22,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fafafa',
    flex: 1,
  },
  optionLabelActive: {
    color: '#a78bfa',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  selectedCount: {
    color: '#71717a',
    fontSize: 13,
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
  },
  primaryBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#a1a1aa',
    fontWeight: '500',
    fontSize: 15,
  },
});
