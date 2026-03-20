import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
  ListRenderItemInfo,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useFeed } from '@/features/feed/hooks/useFeed';
import { FeedCard } from '@/features/feed/components/FeedCard';
import type { FeedCard as FeedCardType } from '@/features/feed/hooks/useFeed';
import { useAuthStore } from '@/shared/auth/authStore';
import apiClient from '@/shared/api/client';
import { CARDS } from '@/shared/api/endpoints';
import { StoriesRow } from '@/features/stories/components/StoriesRow';
import type { RootStackParamList } from '@/shared/navigation/RootNavigator';

type FeedNavProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Tab type ────────────────────────────────────────────────────────────────

type FeedTab = 'forYou' | 'following' | 'clips' | 'explore';

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'forYou',    label: 'For You' },
  { key: 'following', label: 'Following' },
  { key: 'clips',     label: 'Clips' },
  { key: 'explore',   label: 'Explore' },
];

// ─── Study banner ─────────────────────────────────────────────────────────────

function StudyBanner() {
  const navigation = useNavigation<FeedNavProp>();

  const { data: dueCards } = useQuery({
    queryKey: ['due-cards-count'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>(`${CARDS.DUE}?limit=50`);
      return res.data;
    },
    staleTime: 60_000 * 5,
  });

  const count = dueCards?.length ?? 0;
  if (count === 0) return null;

  return (
    <View style={ss.studyBanner}>
      <View style={ss.studyBannerLeft}>
        <View style={ss.studyIconCircle}>
          <Ionicons name="time-outline" size={18} color="#8b5cf6" />
        </View>
        <View>
          <Text style={ss.studyBannerTitle}>{count} cards due for review</Text>
          <Text style={ss.studyBannerSub}>Keep your streak going</Text>
        </View>
      </View>
      <TouchableOpacity style={ss.studyBtn} activeOpacity={0.85}
        onPress={() => (navigation as any).navigate('Main', { screen: 'Deck' })}>
        <Text style={ss.studyBtnText}>Study</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Quick cards row ──────────────────────────────────────────────────────────

function QuickCardsRow({ cards }: { cards: FeedCardType[] }) {
  if (cards.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={ss.quickCardsRow}
      style={ss.quickCardsContainer}
    >
      {cards.slice(0, 6).map((card) => (
        <TouchableOpacity key={card.id} style={ss.quickCard} activeOpacity={0.8}>
          <View style={ss.quickCardDot} />
          <Text style={ss.quickCardText} numberOfLines={1}>
            {card.question}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function FeedTopBar() {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<FeedNavProp>();
  const [imgErr, setImgErr] = useState(false);
  const hasAvatar = !!user?.profile_picture && !imgErr;

  return (
    <View style={ss.topBar}>
      {/* Avatar */}
      <TouchableOpacity onPress={() => navigation.navigate('Main' as any)}>
        {hasAvatar ? (
          <Image
            source={{ uri: user!.profile_picture! }}
            style={ss.topBarAvatar}
            onError={() => setImgErr(true)}
          />
        ) : (
          <View style={[ss.topBarAvatar, ss.topBarAvatarFallback]}>
            <Text style={ss.topBarAvatarText}>
              {(user?.username ?? user?.full_name ?? 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Brand */}
      <Text style={ss.brandLogo}>ariel</Text>

      {/* Icons */}
      <View style={ss.topBarIcons}>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => navigation.navigate('Discover')}
        >
          <Ionicons name="search-outline" size={22} color="#a1a1aa" />
        </TouchableOpacity>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => navigation.navigate('Messages')}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#a1a1aa" />
        </TouchableOpacity>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={22} color="#a1a1aa" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
}: {
  active: FeedTab;
  onChange: (tab: FeedTab) => void;
}) {
  return (
    <View style={ss.tabBar}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={ss.tabItem}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[ss.tabLabel, isActive && ss.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={ss.tabUnderline} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  const pulse = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.skeletonContainer, { opacity: pulse }]}>
      <View style={styles.skeletonAuthorRow}>
        <View style={styles.skeletonAvatar} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.skeletonLine, { width: '60%', height: 12 }]} />
          <View style={[styles.skeletonLine, { width: '40%', height: 10 }]} />
        </View>
      </View>
      <View style={styles.skeletonCard}>
        <View style={[styles.skeletonLine, { width: '90%', height: 14, marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '75%', height: 14, marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '50%', height: 14 }]} />
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function FeedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<FeedNavProp>();
  const [activeTab, setActiveTab] = useState<FeedTab>('forYou');

  const feedTab = activeTab === 'following' ? 'following' : 'forYou';
  const { cards, isLoading, refetch, isRefetching } = useFeed(feedTab);

  const handleTabChange = useCallback((tab: FeedTab) => {
    if (tab === 'clips') {
      navigation.navigate('Reels');
      return;
    }
    if (tab === 'explore') {
      navigation.navigate('Discover');
      return;
    }
    setActiveTab(tab);
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedCardType>) => <FeedCard card={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: FeedCardType) => item.id ?? `card_${Math.random()}`,
    [],
  );

  const ListHeader = useCallback(
    () => (
      <>
        <StoriesRow />
        <TabBar active={activeTab} onChange={handleTabChange} />
        <StudyBanner />
        <QuickCardsRow cards={cards} />
      </>
    ),
    [activeTab, cards, handleTabChange],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FeedTopBar />

      {isLoading ? (
        <>
          <TabBar active={activeTab} onChange={handleTabChange} />
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 48 }}>📚</Text>
              <Text style={styles.emptyTitle}>Your feed is empty</Text>
              <Text style={styles.emptySubtitle}>
                Follow other learners or create your first flashcard.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#8b5cf6"
              colors={['#8b5cf6']}
            />
          }
          contentContainerStyle={cards.length === 0 ? styles.emptyFlatList : undefined}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={10}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090b' },
  skeletonContainer: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#27272a',
  },
  skeletonAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  skeletonAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#27272a' },
  skeletonLine: { backgroundColor: '#27272a', borderRadius: 4 },
  skeletonCard: { backgroundColor: '#18181b', borderRadius: 12, padding: 14, marginBottom: 10 },
  emptyFlatList: { flexGrow: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { color: '#fafafa', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: '#71717a', fontSize: 14, lineHeight: 22, textAlign: 'center' },
});

const ss = StyleSheet.create({
  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  topBarAvatar: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
  topBarAvatarFallback: { backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  topBarAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  brandLogo: {
    flex: 1,
    textAlign: 'center',
    color: '#fafafa',
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  topBarIcons: { flexDirection: 'row', gap: 16, alignItems: 'center' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    position: 'relative',
  },
  tabLabel: { color: '#71717a', fontSize: 14, fontWeight: '500' },
  tabLabelActive: { color: '#fafafa', fontWeight: '700' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0, left: 16, right: 16,
    height: 2, backgroundColor: '#7c3aed', borderRadius: 1,
  },

  // Study banner
  studyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#18181b',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  studyBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studyIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  studyBannerTitle: { color: '#fafafa', fontSize: 14, fontWeight: '600' },
  studyBannerSub: { color: '#71717a', fontSize: 12, marginTop: 1 },
  studyBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20,
  },
  studyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Quick cards
  quickCardsContainer: { borderBottomWidth: 1, borderBottomColor: '#18181b' },
  quickCardsRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
    maxWidth: 180,
  },
  quickCardDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b', flexShrink: 0 },
  quickCardText: { color: '#a1a1aa', fontSize: 12, flex: 1 },
});
