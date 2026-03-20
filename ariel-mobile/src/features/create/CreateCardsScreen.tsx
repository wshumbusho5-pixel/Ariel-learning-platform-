import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import apiClient from '@/shared/api/client';
import { CARDS } from '@/shared/api/endpoints';
import { SUBJECT_META } from '@/shared/constants/subjects';

type Mode = 'manual' | 'ai';

interface CardDraft {
  id: string;
  question: string;
  answer: string;
  explanation: string;
}

// ─── Subject picker ───────────────────────────────────────────────────────────

const SUBJECT_LIST = Object.entries(SUBJECT_META).map(([key, meta]) => ({
  key,
  label: meta.label,
  icon: meta.icon,
}));

function SubjectPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = SUBJECT_LIST.find((s) => s.key === value);

  return (
    <View>
      <TouchableOpacity
        style={sp.trigger}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.7}
      >
        <Text style={sp.triggerText}>
          {selected ? `${selected.icon} ${selected.label}` : 'Select subject…'}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#71717a"
        />
      </TouchableOpacity>

      {open && (
        <ScrollView style={sp.dropdown} nestedScrollEnabled>
          <TouchableOpacity
            style={sp.option}
            onPress={() => { onChange(''); setOpen(false); }}
          >
            <Text style={sp.optionText}>None</Text>
          </TouchableOpacity>
          {SUBJECT_LIST.filter((s) => s.key !== 'other').map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[sp.option, value === s.key && sp.optionActive]}
              onPress={() => { onChange(s.key); setOpen(false); }}
            >
              <Text style={sp.optionText}>
                {s.icon} {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const sp = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerText: { color: '#d4d4d8', fontSize: 14 },
  dropdown: {
    maxHeight: 200,
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
    marginTop: 4,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionActive: { backgroundColor: 'rgba(139,92,246,0.12)' },
  optionText: { color: '#d4d4d8', fontSize: 14 },
});

// ─── Single card editor ───────────────────────────────────────────────────────

function CardEditor({
  card,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  card: CardDraft;
  index: number;
  onUpdate: (id: string, field: keyof CardDraft, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  return (
    <View style={ce.container}>
      <View style={ce.header}>
        <Text style={ce.num}>Card {index + 1}</Text>
        {canRemove && (
          <TouchableOpacity onPress={() => onRemove(card.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={17} color="#52525b" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={ce.label}>Question *</Text>
      <TextInput
        style={ce.input}
        value={card.question}
        onChangeText={(v) => onUpdate(card.id, 'question', v)}
        placeholder="e.g. What is the powerhouse of the cell?"
        placeholderTextColor="#52525b"
        multiline
        maxLength={500}
      />

      <Text style={[ce.label, { marginTop: 10 }]}>Answer *</Text>
      <TextInput
        style={ce.input}
        value={card.answer}
        onChangeText={(v) => onUpdate(card.id, 'answer', v)}
        placeholder="e.g. The mitochondria"
        placeholderTextColor="#52525b"
        multiline
        maxLength={500}
      />

      <Text style={[ce.label, { marginTop: 10 }]}>
        Explanation <Text style={ce.optional}>(optional)</Text>
      </Text>
      <TextInput
        style={[ce.input, { minHeight: 60 }]}
        value={card.explanation}
        onChangeText={(v) => onUpdate(card.id, 'explanation', v)}
        placeholder="Add a hint or deeper context…"
        placeholderTextColor="#52525b"
        multiline
        maxLength={1000}
      />
    </View>
  );
}

const ce = StyleSheet.create({
  container: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3f3f46',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  num: { color: '#71717a', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  label: { color: '#a1a1aa', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  optional: { color: '#52525b', fontWeight: '400' },
  input: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#fafafa',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 44,
    textAlignVertical: 'top',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function CreateCardsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [mode, setMode] = useState<Mode>('manual');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [caption, setCaption] = useState('');
  const [cards, setCards] = useState<CardDraft[]>([
    { id: '1', question: '', answer: '', explanation: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const validCards = cards.filter((c) => c.question.trim() && c.answer.trim());

  const addCard = useCallback(() => {
    setCards((prev) => [
      ...prev,
      { id: Date.now().toString(), question: '', answer: '', explanation: '' },
    ]);
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateCard = useCallback(
    (id: string, field: keyof CardDraft, value: string) => {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
      );
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (validCards.length === 0) {
      setError('Add at least one card with a question and answer.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await apiClient.post(CARDS.BULK, {
        cards: validCards.map((c) => ({
          question: c.question.trim(),
          answer: c.answer.trim(),
          explanation: c.explanation.trim() || undefined,
          subject: subject || undefined,
          topic: topic || undefined,
          tags: [],
        })),
        subject: subject || undefined,
        topic: topic || undefined,
        tags: [],
        visibility,
        caption: caption.trim() || undefined,
      });
      Alert.alert('Saved!', `${validCards.length} card${validCards.length !== 1 ? 's' : ''} added to your deck.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || err?.message || 'Something went wrong.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [validCards, subject, topic, visibility, caption, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#fafafa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Flash Cards</Text>
        {mode === 'manual' && validCards.length > 0 && !saving ? (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>
              Save {validCards.length}
            </Text>
          </TouchableOpacity>
        ) : saving ? (
          <ActivityIndicator size="small" color="#8b5cf6" />
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Mode switcher */}
      <View style={styles.modeSwitcher}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
          onPress={() => setMode('manual')}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={15} color={mode === 'manual' ? '#fafafa' : '#71717a'} />
          <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>
            Write my own
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'ai' && styles.modeBtnActive]}
          onPress={() => setMode('ai')}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 13 }}>✦</Text>
          <Text style={[styles.modeBtnText, mode === 'ai' && styles.modeBtnTextActive]}>
            Ask Ariel
          </Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </TouchableOpacity>
      </View>

      {mode === 'ai' ? (
        <View style={styles.aiPlaceholder}>
          <Text style={{ fontSize: 40 }}>✦</Text>
          <Text style={styles.aiTitle}>AI Card Generation</Text>
          <Text style={styles.aiSub}>
            Paste a URL, text, PDF or image and Ariel will generate flash cards for you.
          </Text>
          <View style={styles.proLockBadge}>
            <Text style={styles.proLockText}>Coming soon — PRO feature</Text>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Deck info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Deck Info</Text>

            <Text style={styles.fieldLabel}>Subject <Text style={styles.optional}>(optional)</Text></Text>
            <SubjectPicker value={subject} onChange={setSubject} />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
              Topic <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g. Cell Biology"
              placeholderTextColor="#52525b"
              maxLength={80}
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
              Caption <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.textInput, { minHeight: 60 }]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption for your post…"
              placeholderTextColor="#52525b"
              multiline
              maxLength={300}
              textAlignVertical="top"
            />

            {/* Visibility */}
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Visibility</Text>
            <View style={styles.visibilityRow}>
              {(['public', 'private'] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.visChip,
                    visibility === v && styles.visChipActive,
                  ]}
                  onPress={() => setVisibility(v)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={v === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                    size={14}
                    color={visibility === v ? '#a78bfa' : '#71717a'}
                  />
                  <Text
                    style={[
                      styles.visChipText,
                      visibility === v && styles.visChipTextActive,
                    ]}
                  >
                    {v === 'public' ? 'Public' : 'Private'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cards */}
          <Text style={[styles.sectionLabel, { marginTop: 20, paddingHorizontal: 16 }]}>
            Cards ({cards.length})
          </Text>

          <View style={styles.cardsContainer}>
            {cards.map((card, index) => (
              <CardEditor
                key={card.id}
                card={card}
                index={index}
                onUpdate={updateCard}
                onRemove={removeCard}
                canRemove={cards.length > 1}
              />
            ))}
          </View>

          {/* Add card */}
          <TouchableOpacity style={styles.addCardBtn} onPress={addCard} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={20} color="#7c3aed" />
            <Text style={styles.addCardText}>Add another card</Text>
          </TouchableOpacity>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Save button (also at bottom for convenience) */}
          {validCards.length > 0 && (
            <TouchableOpacity
              style={[styles.saveBottomBtn, saving && styles.saveBottomBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBottomBtnText}>
                  Save {validCards.length} card{validCards.length !== 1 ? 's' : ''}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090b' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    color: '#fafafa',
    fontSize: 17,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  modeSwitcher: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  modeBtnActive: { backgroundColor: '#27272a' },
  modeBtnText: { color: '#71717a', fontSize: 13, fontWeight: '600' },
  modeBtnTextActive: { color: '#fafafa' },
  proBadge: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  proBadgeText: { color: '#fbbf24', fontSize: 9, fontWeight: '800' },

  // AI placeholder
  aiPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  aiTitle: { color: '#fafafa', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  aiSub: { color: '#71717a', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  proLockBadge: {
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  proLockText: { color: '#fbbf24', fontSize: 13, fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8 },

  section: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#52525b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  optional: { color: '#52525b', fontWeight: '400' },
  textInput: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#fafafa',
    fontSize: 14,
    minHeight: 42,
    textAlignVertical: 'top',
  },
  visibilityRow: { flexDirection: 'row', gap: 8 },
  visChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  visChipActive: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderColor: 'rgba(139,92,246,0.35)',
  },
  visChipText: { color: '#71717a', fontSize: 13, fontWeight: '500' },
  visChipTextActive: { color: '#a78bfa', fontWeight: '600' },

  cardsContainer: { paddingHorizontal: 16 },

  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addCardText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
  errorText: { color: '#f87171', fontSize: 13, lineHeight: 19 },

  saveBottomBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 15,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBottomBtnDisabled: { opacity: 0.5 },
  saveBottomBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
