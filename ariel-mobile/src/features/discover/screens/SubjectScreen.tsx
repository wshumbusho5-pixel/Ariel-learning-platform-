import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import { getSubjectCards } from '@/features/discover/api/discoverApi';
import type { TrendingCard } from '@/features/discover/api/discoverApi';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/shared/navigation/RootNavigator';
import { CardSlide } from '@/features/discover/components/CardSlide';

type SubjectScreenProps = NativeStackScreenProps<RootStackParamList, 'SubjectDetail'>;

// ─── Main screen ──────────────────────────────────────────────────────────────

export function SubjectScreen({ navigation, route }: SubjectScreenProps) {
  const insets = useSafeAreaInsets();
  const { height: SCREEN_H } = useWindowDimensions();
  const subjectKey = normalizeSubjectKey(route.params.subjectKey) as SubjectKey;
  const meta = SUBJECT_META[subjectKey];
  const [cards, setCards] = useState<TrendingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getSubjectCards(subjectKey, 50)
      .then(setCards)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [subjectKey]);

  useEffect(() => { load(); }, [load]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<TrendingCard>) => (
      <CardSlide
        card={item}
        subjectKey={subjectKey}
        isFirst={index === 0}
        totalCount={cards.length}
        index={index}
      />
    ),
    [subjectKey, cards.length],
  );

  const keyExtractor = useCallback(
    (item: TrendingCard, i: number) => item.id ?? `${i}`,
    [],
  );

  return (
    <View style={a.screen}>
      {/* Fixed header — back button + subject name */}
      <View style={[a.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={a.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Ionicons name={meta.icon as any} size={16} color={meta.color} />
          <Text style={[a.headerTitle, { color: meta.color }]} numberOfLines={1}>
            {meta.label}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={a.center}>
          <ActivityIndicator color={meta.color} size="large" />
          <Text style={[a.loadingText, { color: meta.color }]}>Loading {meta.label} cards…</Text>
        </View>
      ) : error ? (
        <View style={a.center}>
          <Ionicons name={meta.icon as any} size={40} color={meta.color} />
          <Text style={a.stateTitle}>Couldn't load cards</Text>
          <TouchableOpacity onPress={load} style={a.retryBtn}>
            <Text style={a.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : cards.length === 0 ? (
        <View style={a.center}>
          <Ionicons name={meta.icon as any} size={48} color={meta.color} />
          <Text style={a.stateTitle}>No {meta.label} cards yet</Text>
          <Text style={a.stateSub}>Be the first to create one.</Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_H}
          snapToAlignment="start"
          decelerationRate="fast"
          removeClippedSubviews
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={5}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const a = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Fixed header overlay
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    minHeight: 44,
    backgroundColor: 'rgba(0,0,0,0.45)',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },

  // Center states (loading / error / empty)
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  stateTitle: {
    color: '#e4e4e7',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateSub: {
    color: '#71717a',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#27272a',
  },
  retryText: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '600',
  },
});
