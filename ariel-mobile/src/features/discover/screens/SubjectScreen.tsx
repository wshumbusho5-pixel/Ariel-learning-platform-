import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubjectTag } from '@/shared/components/SubjectTag';
import { Avatar } from '@/shared/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/shared/constants/theme';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import { getSubjectCards } from '@/features/discover/api/discoverApi';
import type { TrendingCard } from '@/features/discover/api/discoverApi';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/shared/navigation/RootNavigator';

// ─── Navigation types ─────────────────────────────────────────────────────────

type SubjectScreenProps = NativeStackScreenProps<RootStackParamList, 'SubjectDetail'>;

// ─── Card preview row ─────────────────────────────────────────────────────────

function CardPreview({ card }: { card: TrendingCard }) {
  const subjectKey = normalizeSubjectKey(card.subject);
  const meta = SUBJECT_META[subjectKey];

  return (
    <View style={previewStyles.container}>
      <View style={[previewStyles.strip, { backgroundColor: meta.color }]} />
      <View style={previewStyles.content}>
        {/* Question */}
        <Text style={previewStyles.question} numberOfLines={3}>
          {card.question}
        </Text>

        {/* Footer row */}
        <View style={previewStyles.footer}>
          {/* Author */}
          {card.author_username ? (
            <View style={previewStyles.authorRow}>
              <Avatar
                uri={card.author_profile_picture}
                username={card.author_username}
                size={20}
              />
              <Text style={previewStyles.authorName} numberOfLines={1}>
                @{card.author_username}
              </Text>
            </View>
          ) : null}

          {/* Subject chip */}
          <SubjectTag subject={card.subject ?? 'other'} size="sm" />

          {/* Likes */}
          <View style={previewStyles.likesRow}>
            <Text style={previewStyles.heartIcon}>♥</Text>
            <Text style={previewStyles.likeCount}>{card.likes}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Subject header ───────────────────────────────────────────────────────────

function SubjectHeader({
  subjectKey,
  onBack,
}: {
  subjectKey: SubjectKey;
  onBack: () => void;
}) {
  const meta = SUBJECT_META[subjectKey];
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        headerStyles.container,
        {
          paddingTop: insets.top + SPACING.md,
          backgroundColor: `${meta.color}22`,
          borderBottomColor: `${meta.color}44`,
        },
      ]}
    >
      {/* Back button */}
      <TouchableOpacity onPress={onBack} style={headerStyles.backBtn} activeOpacity={0.7}>
        <Text style={headerStyles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Emoji + name */}
      <Text style={headerStyles.emoji}>{meta.icon}</Text>
      <Text style={[headerStyles.subjectName, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function SubjectScreen({ navigation, route }: SubjectScreenProps) {
  const subjectKey = normalizeSubjectKey(route.params.subjectKey) as SubjectKey;
  const [cards, setCards] = useState<TrendingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    getSubjectCards(subjectKey, 30)
      .then((data) => {
        if (!cancelled) {
          setCards(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [subjectKey]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TrendingCard>) => <CardPreview card={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: TrendingCard) => item.id ?? Math.random().toString(),
    [],
  );

  return (
    <View style={styles.screen}>
      {/* Header with gradient strip */}
      <SubjectHeader subjectKey={subjectKey} onBack={() => navigation.goBack()} />

      {/* Content */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={SUBJECT_META[subjectKey].color} size="large" />
        </View>
      ) : error ? (
        <View style={styles.loader}>
          <Text style={styles.errorText}>Couldn't load cards. Pull to retry.</Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            cards.length === 0 ? styles.emptyList : styles.list
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{SUBJECT_META[subjectKey].icon}</Text>
              <Text style={styles.emptyTitle}>No cards yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to create a {SUBJECT_META[subjectKey].label} card.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
  },
  errorText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
  },
  list: {
    paddingTop: SPACING.md,
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 22,
    textAlign: 'center',
  },
});

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backArrow: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  emoji: {
    fontSize: 28,
  },
  subjectName: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
  },
});

const previewStyles = StyleSheet.create({
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
  strip: {
    width: 3,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    gap: 8,
  },
  question: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '500',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    flexShrink: 1,
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  heartIcon: {
    color: '#f87171',
    fontSize: 11,
  },
  likeCount: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
});
