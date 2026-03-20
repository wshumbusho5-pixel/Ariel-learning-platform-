import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/shared/auth/useAuth';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/shared/constants/theme';
import { SUBJECT_META, CANONICAL_SUBJECT_KEYS } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import { EducationLevel } from '@/shared/types/user';

import { updateProfile } from '@/features/profile/api/profileApi';
import type { ProfileStackParamList } from '@/features/profile/ProfileNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

interface FormState {
  full_name: string;
  username: string;
  bio: string;
  education_level: EducationLevel | '';
  school: string;
  subjects: string[];
}

// ─── Education Level Options ──────────────────────────────────────────────────

const EDUCATION_OPTIONS: { label: string; value: EducationLevel }[] = [
  { label: 'High School', value: EducationLevel.HIGH_SCHOOL },
  { label: 'University', value: EducationLevel.UNIVERSITY },
  { label: 'Professional', value: EducationLevel.PROFESSIONAL },
  { label: 'Self Study', value: EducationLevel.SELF_STUDY },
];

// ─── Subject Pill ─────────────────────────────────────────────────────────────

interface SubjectPillProps {
  subjectKey: SubjectKey;
  selected: boolean;
  onToggle: (key: SubjectKey) => void;
}

function SubjectPill({ subjectKey, selected, onToggle }: SubjectPillProps) {
  const meta = SUBJECT_META[subjectKey];
  const color = meta.color;

  return (
    <TouchableOpacity
      style={[
        pillStyles.pill,
        {
          backgroundColor: selected ? `${color}33` : COLORS.surface2,
          borderColor: selected ? color : COLORS.border,
        },
      ]}
      onPress={() => onToggle(subjectKey)}
      activeOpacity={0.7}
    >
      <Text style={pillStyles.icon}>{meta.icon}</Text>
      <Text style={[pillStyles.label, { color: selected ? color : COLORS.textSecondary }]}>
        {meta.short}
      </Text>
    </TouchableOpacity>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    gap: 4,
    margin: 3,
  },
  icon: {
    fontSize: 13,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>({
    full_name: user?.full_name ?? '',
    username: user?.username ?? '',
    bio: user?.bio ?? '',
    education_level: (user?.education_level as EducationLevel) ?? '',
    school: user?.school ?? '',
    subjects: user?.subjects ?? [],
  });

  const isDirty =
    form.full_name !== (user?.full_name ?? '') ||
    form.username !== (user?.username ?? '') ||
    form.bio !== (user?.bio ?? '') ||
    form.education_level !== (user?.education_level ?? '') ||
    form.school !== (user?.school ?? '') ||
    JSON.stringify(form.subjects.sort()) !== JSON.stringify([...(user?.subjects ?? [])].sort());

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      updateProfile({
        full_name: form.full_name || undefined,
        username: form.username || undefined,
        bio: form.bio || undefined,
        education_level: (form.education_level as EducationLevel) || undefined,
        subjects: form.subjects,
      }),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    },
  });

  const handleBack = useCallback(() => {
    if (!isDirty) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Are you sure you want to go back?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ],
    );
  }, [isDirty, navigation]);

  const toggleSubject = useCallback((key: SubjectKey) => {
    setForm((prev) => {
      const exists = prev.subjects.includes(key);
      return {
        ...prev,
        subjects: exists
          ? prev.subjects.filter((s) => s !== key)
          : [...prev.subjects, key],
      };
    });
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.headerBtn, styles.saveBtn, isPending && styles.saveBtnDisabled]}
            onPress={() => save()}
            disabled={isPending || !isDirty}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.saveBtnText, !isDirty && styles.saveBtnTextDisabled]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={form.full_name}
              onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textMuted}
              autoCorrect={false}
            />
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={form.username}
              onChangeText={(v) => setForm((f) => ({ ...f, username: v }))}
              placeholder="@username"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.bio}
              onChangeText={(v) => setForm((f) => ({ ...f, bio: v }))}
              placeholder="Tell others about yourself..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={styles.charCount}>{form.bio.length}/200</Text>
          </View>

          {/* School */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>School / Institution</Text>
            <TextInput
              style={styles.input}
              value={form.school}
              onChangeText={(v) => setForm((f) => ({ ...f, school: v }))}
              placeholder="e.g. University of Nairobi"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Education Level */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Education Level</Text>
            <View style={styles.educationRow}>
              {EDUCATION_OPTIONS.map((opt) => {
                const selected = form.education_level === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.educationOption,
                      selected && styles.educationOptionSelected,
                    ]}
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        education_level: selected ? '' : opt.value,
                      }))
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.educationOptionText,
                        selected && styles.educationOptionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Subjects */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Subjects</Text>
            <Text style={styles.sublabel}>Select subjects you study or teach</Text>
            <View style={styles.subjectsGrid}>
              {CANONICAL_SUBJECT_KEYS.map((key) => (
                <SubjectPill
                  key={key}
                  subjectKey={key}
                  selected={form.subjects.includes(key)}
                  onToggle={toggleSubject}
                />
              ))}
            </View>
          </View>

          <View style={{ height: insets.bottom + SPACING.lg }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  headerBtn: {
    minWidth: 60,
  },
  headerBtnText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  saveBtn: {
    backgroundColor: COLORS.violet[600],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  saveBtnTextDisabled: {
    color: COLORS.textMuted,
  },

  // Scroll
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },

  // Field
  fieldGroup: {
    gap: SPACING.xs,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
    marginBottom: 2,
  },
  sublabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  textArea: {
    height: 80,
    paddingTop: SPACING.sm,
  },
  charCount: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    alignSelf: 'flex-end',
    marginTop: 2,
  },

  // Education level
  educationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  educationOption: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  educationOptionSelected: {
    borderColor: COLORS.violet[500],
    backgroundColor: `${COLORS.violet[600]}33`,
  },
  educationOptionText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },
  educationOptionTextSelected: {
    color: COLORS.violet[300],
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },

  // Subjects
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
});
