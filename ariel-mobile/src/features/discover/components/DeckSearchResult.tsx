import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/shared/constants/theme';
import type { DeckPost } from '@/shared/types/deck';

interface DeckSearchResultProps {
  deck: DeckPost;
  onPress: (deck: DeckPost) => void;
}

export function DeckSearchResult({ deck, onPress }: DeckSearchResultProps): React.ReactElement {
  const subjectKey = normalizeSubjectKey(deck.subject);
  const meta = SUBJECT_META[subjectKey];
  const color = meta.color;

  return (
    <TouchableOpacity
      onPress={() => onPress(deck)}
      activeOpacity={0.7}
      style={styles.container}
    >
      {/* Subject color strip on the left */}
      <View style={[styles.colorStrip, { backgroundColor: color }]} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Title row */}
        <Text style={styles.title} numberOfLines={2}>
          {deck.title}
        </Text>

        {/* Meta row: card count + author */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {deck.card_count} {deck.card_count === 1 ? 'card' : 'cards'}
          </Text>
          {deck.author_username && (
            <>
              <View style={styles.metaDot} />
              <Text style={styles.metaText} numberOfLines={1}>
                @{deck.author_username}
              </Text>
            </>
          )}
        </View>

        {/* Subject tag */}
        <View
          style={[
            styles.subjectTag,
            { backgroundColor: `${color}22`, borderColor: `${color}55` },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name={meta.icon as any} size={11} color={color} />
            <Text style={[styles.subjectTagText, { color }]}>{meta.short}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  colorStrip: {
    width: 3,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    gap: 4,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    marginTop: 2,
  },
  subjectTagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
  },
});
