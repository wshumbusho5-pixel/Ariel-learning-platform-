import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { SubjectFilter } from '@/features/cards/components/SubjectFilter';

interface DeckHeaderProps {
  insets: EdgeInsets;
  isShort: boolean;
  dueCount: number;
  view: 'Cards' | 'Clips';
  onViewChange: (v: 'Cards' | 'Clips') => void;
  subjects: string[];
  activeSubject: string;
  onSubjectSelect: (s: string) => void;
  onLayout: (e: { nativeEvent: { layout: { height: number } } }) => void;
}

export function DeckHeader({
  insets,
  isShort,
  dueCount,
  view,
  onViewChange,
  subjects,
  activeSubject,
  onSubjectSelect,
  onLayout,
}: DeckHeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View
      style={[ss.floatingHeader, { paddingTop: insets.top }, isShort && { paddingBottom: 4 }]}
      onLayout={onLayout}
      pointerEvents="box-none"
    >
      {/* Title row */}
      <View style={[ss.titleRow, isShort && { paddingTop: 8, paddingBottom: 4 }]}>
        <Text style={[ss.titleText, isShort && { fontSize: 22 }]}>My Deck</Text>
        <View style={ss.titlePills}>
          {dueCount > 0 && (
            <View style={ss.duePill}>
              <View style={ss.dueDot} />
              <Text style={ss.duePillText}>{dueCount} due</Text>
            </View>
          )}
          <TouchableOpacity style={ss.cramPill} activeOpacity={0.8} onPress={() => navigation.navigate('Cram')}>
            <Text style={ss.cramPillText}>⚡ Cram</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cards / Clips toggle */}
      <View style={[ss.toggleRow, isShort && { paddingBottom: 4 }]}>
        <View style={ss.toggle}>
          {(['Cards', 'Clips'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={[ss.toggleItem, view === v && ss.toggleItemActive]}
              onPress={() => onViewChange(v)}
              activeOpacity={0.8}
            >
              <Text style={[ss.toggleText, view === v && ss.toggleTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Subject filter chips */}
      {subjects.length > 0 && (
        <SubjectFilter
          subjects={subjects}
          active={activeSubject}
          onSelect={onSubjectSelect}
        />
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingBottom: 8,
  },

  // Title row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titlePills: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(249,115,22,0.10)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
  },
  dueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f97316',
  },
  duePillText: {
    color: '#fb923c',
    fontSize: 12,
    fontWeight: '700',
  },
  cramPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
  },
  cramPillText: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '700',
  },

  // Cards / Clips toggle
  toggleRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(39,39,42,0.8)',
    borderRadius: 999,
    padding: 2,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(63,63,70,0.6)',
  },
  toggleItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  toggleItemActive: {
    backgroundColor: '#fff',
  },
  toggleText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#000',
  },
});
