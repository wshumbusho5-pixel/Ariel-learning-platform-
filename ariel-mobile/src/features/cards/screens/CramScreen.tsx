import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import apiClient from '@/shared/api/client';
import { AI } from '@/shared/api/endpoints';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CramBlock {
  subject: string;
  topics: string[];
  minutes: number;
  priority: 'critical' | 'high' | 'medium';
  tip: string;
}

interface CramPlan {
  total_minutes: number;
  strategy: string;
  blocks: CramBlock[];
  final_advice: string;
}

const SUBJECTS = [
  'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History',
  'Literature', 'Economics', 'Computer Science', 'Psychology', 'Other',
];

const HOUR_GROUPS = [
  { label: 'Critical', hours: ['1', '2'], color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
  { label: 'Tight', hours: ['3', '4', '6'], color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  { label: 'Comfortable', hours: ['8', '12', '24'], color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
];

const PRIORITY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
  high: { color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)' },
  medium: { color: '#c4b5fd', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)' },
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export function CramScreen() {
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const isShort = H < 720;
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [hoursLeft, setHoursLeft] = useState('');
  const [topics, setTopics] = useState('');
  const [weakAreas, setWeakAreas] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<CramPlan | null>(null);
  const [error, setError] = useState('');
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());

  const finalSubject = subject === 'Other' ? customSubject : subject;

  const handleGenerate = useCallback(async () => {
    if (!finalSubject.trim() || !hoursLeft) return;
    setLoading(true);
    setError('');
    setPlan(null);

    const prompt = `You are an expert study coach. A student has ${hoursLeft} hour(s) until their ${finalSubject} exam.
${topics ? `Topics covered: ${topics}` : ''}
${weakAreas ? `Weak areas they struggle with: ${weakAreas}` : ''}

Create a focused cram plan as a JSON object with this exact shape:
{
  "total_minutes": <number>,
  "strategy": "<one sentence strategy>",
  "blocks": [
    {
      "subject": "${finalSubject}",
      "topics": ["<topic1>", "<topic2>"],
      "minutes": <number>,
      "priority": "critical" | "high" | "medium",
      "tip": "<specific actionable tip for this block>"
    }
  ],
  "final_advice": "<motivating 1-sentence send-off>"
}

Rules: blocks should add up to total_minutes. Prioritize high-yield topics. Max 6 blocks. Include 5-min breaks between blocks. Return only valid JSON.`;

    try {
      const res = await apiClient.post(AI.COMPLETE, { prompt });
      const raw = typeof res.data?.reply === 'string' ? res.data.reply : JSON.stringify(res.data?.reply ?? '');
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed: CramPlan = JSON.parse(jsonMatch[0]);
      setPlan(parsed);
    } catch {
      setError('Failed to generate plan. Check your AI provider settings and try again.');
    } finally {
      setLoading(false);
    }
  }, [finalSubject, hoursLeft, topics, weakAreas]);

  const markDone = useCallback((idx: number) => {
    setCompletedBlocks((prev) => new Set([...prev, idx]));
    setActiveBlock(null);
  }, []);

  const resetPlan = useCallback(() => {
    setPlan(null);
    setCompletedBlocks(new Set());
    setActiveBlock(null);
  }, []);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Cram Mode</Text>
          <Text style={s.headerSub}>Exam triage — make every minute count</Text>
        </View>
        {plan && (
          <TouchableOpacity onPress={resetPlan}>
            <Text style={s.newPlanBtn}>New plan</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!plan ? (
          <>
            {/* Tip banner */}
            <View style={s.banner}>
              <Ionicons name="sparkles" size={18} color="#c4b5fd" />
              <Text style={s.bannerText}>
                Tell Ariel your situation — it'll build the most efficient study plan for the time you have left.
              </Text>
            </View>

            {/* Subject */}
            <Text style={s.label}>Subject</Text>
            <View style={s.chipRow}>
              {SUBJECTS.map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={[s.chip, subject === sub && s.chipActive]}
                  onPress={() => setSubject(sub)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, subject === sub && s.chipTextActive]}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {subject === 'Other' && (
              <TextInput
                style={s.input}
                value={customSubject}
                onChangeText={setCustomSubject}
                placeholder="Enter subject..."
                placeholderTextColor="#52525b"
              />
            )}

            {/* Hours */}
            <Text style={[s.label, { marginTop: 20 }]}>Hours until exam</Text>
            {HOUR_GROUPS.map((group) => (
              <View key={group.label} style={s.hourGroup}>
                <Text style={[s.hourLabel, { color: group.color }]}>{group.label}</Text>
                <View style={s.hourBtns}>
                  {group.hours.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        s.hourBtn,
                        { borderColor: group.border },
                        hoursLeft === h && { backgroundColor: group.color, borderColor: group.color },
                      ]}
                      onPress={() => setHoursLeft(h)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.hourBtnText, hoursLeft === h && { color: '#fff' }]}>{h}h</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Topics */}
            <Text style={[s.label, { marginTop: 20 }]}>
              Topics covered <Text style={s.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[s.input, { minHeight: 70 }]}
              value={topics}
              onChangeText={setTopics}
              placeholder="e.g., Mitosis, DNA replication, Protein synthesis..."
              placeholderTextColor="#52525b"
              multiline
              textAlignVertical="top"
            />

            {/* Weak areas */}
            <Text style={[s.label, { marginTop: 16 }]}>
              Weak areas <Text style={s.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[s.input, { minHeight: 56 }]}
              value={weakAreas}
              onChangeText={setWeakAreas}
              placeholder="e.g., I always confuse meiosis vs mitosis..."
              placeholderTextColor="#52525b"
              multiline
              textAlignVertical="top"
            />

            {!!error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Generate */}
            <TouchableOpacity
              style={[s.generateBtn, (!finalSubject.trim() || !hoursLeft || loading) && s.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={!finalSubject.trim() || !hoursLeft || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={s.generateBtnText}>Building your plan...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                  <Text style={s.generateBtnText}>Build cram plan</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Summary */}
            <View style={s.summaryCard}>
              <View style={s.summaryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.summaryLabel}>YOUR PLAN</Text>
                  <Text style={s.summaryTitle}>{finalSubject} — {plan.total_minutes} min</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.summaryHours}>{hoursLeft}h</Text>
                  <Text style={s.summaryRemaining}>remaining</Text>
                </View>
              </View>
              <Text style={s.summaryStrategy}>{plan.strategy}</Text>
            </View>

            {/* Progress */}
            <View style={s.progressRow}>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${(completedBlocks.size / plan.blocks.length) * 100}%` }]} />
              </View>
              <Text style={s.progressText}>{completedBlocks.size}/{plan.blocks.length} done</Text>
            </View>

            {/* Blocks */}
            {plan.blocks.map((block, idx) => {
              const isActive = activeBlock === idx;
              const isDone = completedBlocks.has(idx);
              const pc = isDone ? PRIORITY_COLORS.medium : (PRIORITY_COLORS[block.priority] ?? PRIORITY_COLORS.medium);

              return (
                <View key={idx} style={[s.block, isActive && s.blockActive, isDone && s.blockDone]}>
                  <TouchableOpacity
                    style={s.blockHeader}
                    onPress={() => setActiveBlock(isActive ? null : idx)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.priorityDot, { backgroundColor: pc.color }]} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={s.blockMeta}>
                        <View style={[s.priorityBadge, { backgroundColor: pc.bg, borderColor: pc.border }]}>
                          <Text style={[s.priorityText, { color: pc.color }]}>
                            {isDone ? 'Done' : block.priority}
                          </Text>
                        </View>
                        <Text style={s.blockMinutes}>{block.minutes} min</Text>
                      </View>
                      <Text style={s.blockTopics} numberOfLines={isActive ? undefined : 1}>
                        {block.topics.join(', ')}
                      </Text>
                    </View>
                    <Ionicons
                      name={isActive ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#52525b"
                    />
                  </TouchableOpacity>

                  {isActive && (
                    <View style={s.blockBody}>
                      <Text style={s.blockTip}>{block.tip}</Text>
                      {!isDone && (
                        <TouchableOpacity style={s.markDoneBtn} onPress={() => markDone(idx)} activeOpacity={0.8}>
                          <Ionicons name="checkmark-circle" size={16} color="#fff" />
                          <Text style={s.markDoneBtnText}>Mark done</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Final advice */}
            <View style={s.adviceCard}>
              <Text style={s.adviceText}>"{plan.final_advice}"</Text>
            </View>

            {completedBlocks.size === plan.blocks.length && (
              <View style={s.doneCard}>
                <Text style={s.doneTitle}>You're ready.</Text>
                <Text style={s.doneSub}>Go get it.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090b' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    gap: 12,
  },
  headerTitle: { color: '#fafafa', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#52525b', fontSize: 11, marginTop: 1 },
  newPlanBtn: { color: '#71717a', fontSize: 14, fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    borderRadius: 14,
    padding: 14,
  },
  bannerText: { flex: 1, color: '#c4b5fd', fontSize: 13, lineHeight: 19 },

  label: { color: '#fafafa', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  optional: { color: '#52525b', fontWeight: '400' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  chipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  chipText: { color: '#71717a', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  input: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fafafa',
    fontSize: 14,
    marginTop: 8,
  },

  hourGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  hourLabel: { fontSize: 10, fontWeight: '800', width: 70 },
  hourBtns: { flexDirection: 'row', flex: 1, gap: 6 },
  hourBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#18181b',
    alignItems: 'center',
  },
  hourBtnText: { color: '#71717a', fontSize: 13, fontWeight: '700' },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    padding: 12,
  },
  errorText: { color: '#f87171', fontSize: 13 },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  generateBtnDisabled: { backgroundColor: '#27272a' },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Plan view
  summaryCard: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#52525b', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  summaryTitle: { color: '#fafafa', fontSize: 16, fontWeight: '700' },
  summaryHours: { color: '#f87171', fontSize: 24, fontWeight: '800' },
  summaryRemaining: { color: '#52525b', fontSize: 11 },
  summaryStrategy: { color: '#a1a1aa', fontSize: 13, lineHeight: 19 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#27272a', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#a78bfa', borderRadius: 3 },
  progressText: { color: '#52525b', fontSize: 11, fontWeight: '600' },

  block: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    overflow: 'hidden',
  },
  blockActive: { borderColor: '#3f3f46' },
  blockDone: { borderColor: 'rgba(139,92,246,0.3)', backgroundColor: 'rgba(139,92,246,0.05)' },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  blockMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  blockMinutes: { color: '#52525b', fontSize: 11 },
  blockTopics: { color: '#fafafa', fontSize: 13, fontWeight: '600' },
  blockBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    gap: 12,
  },
  blockTip: { color: '#a1a1aa', fontSize: 13, lineHeight: 19, paddingTop: 12 },
  markDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 10,
  },
  markDoneBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  adviceCard: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 16,
  },
  adviceText: { color: '#a1a1aa', fontSize: 13, lineHeight: 19, fontStyle: 'italic' },

  doneCard: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  doneTitle: { color: '#c4b5fd', fontSize: 22, fontWeight: '800' },
  doneSub: { color: 'rgba(196,181,253,0.6)', fontSize: 14, marginTop: 4 },
});
