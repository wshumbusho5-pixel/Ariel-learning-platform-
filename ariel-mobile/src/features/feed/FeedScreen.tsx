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
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useFeed } from '@/features/feed/hooks/useFeed';
import { ArielWordmark } from '@/shared/components/ArielWordmark';
import { FeedCard } from '@/features/feed/components/FeedCard';
import type { FeedCard as FeedCardType } from '@/features/feed/hooks/useFeed';
import { useAuthStore } from '@/shared/auth/authStore';
import apiClient from '@/shared/api/client';
import { CARDS } from '@/shared/api/endpoints';
import { StoriesRow } from '@/features/stories/components/StoriesRow';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
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

function StudyBanner({ isShort }: { isShort: boolean }) {
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
    <View style={[ss.studyBanner, isShort && { marginVertical: 6, paddingVertical: 8 }]}>
      <View style={ss.studyBannerLeft}>
        <View style={[ss.studyIconCircle, isShort && { width: 30, height: 30, borderRadius: 15 }]}>
          <Ionicons name="time-outline" size={isShort ? 14 : 18} color="#8b5cf6" />
        </View>
        <View>
          <Text style={ss.studyBannerTitle}>{count} cards due for review</Text>
          <Text style={ss.studyBannerSub}>Keep your streak going</Text>
        </View>
      </View>
      <TouchableOpacity style={[ss.studyBtn, isShort && { paddingHorizontal: 14, paddingVertical: 6 }]} activeOpacity={0.85}
        onPress={() => (navigation as any).navigate('Main', { screen: 'Deck' })}>
        <Text style={ss.studyBtnText}>Study</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Quick cards row ──────────────────────────────────────────────────────────

function SubjectFilterRow({
  subjects,
  active,
  onSelect,
}: {
  subjects: string[];
  active: string;
  onSelect: (s: string) => void;
}) {
  if (subjects.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={ss.quickCardsRow}
      style={ss.quickCardsContainer}
    >
      <TouchableOpacity
        style={[ss.subjectChip, active === 'All' && ss.subjectChipActive]}
        onPress={() => onSelect('All')}
        activeOpacity={0.7}
      >
        <Text style={[ss.subjectChipText, active === 'All' && ss.subjectChipTextActive]}>All</Text>
      </TouchableOpacity>
      {subjects.map((subKey) => {
        const meta = SUBJECT_META[normalizeSubjectKey(subKey) as SubjectKey] ?? SUBJECT_META.other;
        const isActive = active === subKey;
        return (
          <TouchableOpacity
            key={subKey}
            style={[
              ss.subjectChip,
              isActive && { backgroundColor: meta.color + '22', borderColor: meta.color + '55' },
            ]}
            onPress={() => onSelect(subKey)}
            activeOpacity={0.7}
          >
            <Ionicons name={meta.icon as any} size={12} color={meta.color} />
            <Text style={[ss.subjectChipText, isActive && { color: meta.color }]}>
              {meta.short}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function FeedTopBar({ isShort }: { isShort: boolean }) {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<FeedNavProp>();
  const [imgErr, setImgErr] = useState(false);
  const hasAvatar = !!user?.profile_picture && !imgErr;
  const displayName = user?.username ?? user?.full_name ?? 'You';

  const avatarSize = isShort ? 38 : 48;
  const avatarRadius = avatarSize / 2;

  return (
    <View style={[ss.topBar, isShort && { paddingTop: 6, paddingBottom: 8 }]}>
      {/* Left: avatar + username */}
      <View style={ss.topBarLeft}>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('Main', { screen: 'Profile' })}
          activeOpacity={0.8}
        >
          {hasAvatar ? (
            <Image
              source={{ uri: user!.profile_picture! }}
              style={[ss.topBarAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarRadius }]}
              onError={() => setImgErr(true)}
            />
          ) : (
            <View style={[ss.topBarAvatar, ss.topBarAvatarFallback, { width: avatarSize, height: avatarSize, borderRadius: avatarRadius }]}>
              <Text style={[ss.topBarAvatarText, isShort && { fontSize: 15 }]}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[ss.topBarUsername, isShort && { fontSize: 19 }]}>{displayName}</Text>
      </View>

      {/* Right: ariel wordmark + icons */}
      <View style={ss.topBarRight}>
        <ArielWordmark size={isShort ? 18 : 22} />
        <View style={ss.topBarIcons}>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => navigation.navigate('Discover')}>
            <Ionicons name="search" size={isShort ? 20 : 23} color="#e7e9ea" />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => navigation.navigate('Messages')}>
            <Ionicons name="chatbubble" size={isShort ? 19 : 22} color="#e7e9ea" />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications" size={isShort ? 20 : 23} color="#e7e9ea" />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="ellipsis-horizontal" size={isShort ? 19 : 22} color="#e7e9ea" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
  isShort = false,
}: {
  active: FeedTab;
  onChange: (tab: FeedTab) => void;
  isShort?: boolean;
}) {
  return (
    <View style={ss.tabBar}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[ss.tabItem, isShort && { paddingVertical: 8 }]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[ss.tabLabel, isActive && ss.tabLabelActive, isShort && { fontSize: 13 }]}>
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
  const { width: W, height: H } = useWindowDimensions();
  const isShort = H < 720;
  const navigation = useNavigation<FeedNavProp>();
  const [activeTab, setActiveTab] = useState<FeedTab>('forYou');
  const [activeSubject, setActiveSubject] = useState('All');
  const user = useAuthStore((s) => s.user);

  const feedTab = activeTab === 'following' ? 'following' : 'forYou';
  const { cards: allCards, isLoading, refetch, isRefetching } = useFeed(feedTab);

  // Derive unique subjects from user's subjects + cards in feed
  const feedSubjects = React.useMemo(() => {
    const set = new Set<string>(user?.subjects ?? []);
    allCards.forEach((c) => { if (c.subject) set.add(c.subject); });
    return [...set];
  }, [allCards, user?.subjects]);

  // Filter cards by selected subject
  const cards = React.useMemo(() => {
    if (activeSubject === 'All') return allCards;
    return allCards.filter((c) => c.subject === activeSubject);
  }, [allCards, activeSubject]);

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
        <TabBar active={activeTab} onChange={handleTabChange} isShort={isShort} />
        <StudyBanner isShort={isShort} />
        <SubjectFilterRow subjects={feedSubjects} active={activeSubject} onSelect={setActiveSubject} />
      </>
    ),
    [activeTab, feedSubjects, activeSubject, handleTabChange, isShort],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FeedTopBar isShort={isShort} />

      {isLoading ? (
        <>
          <TabBar active={activeTab} onChange={handleTabChange} isShort={isShort} />
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
  screen: { flex: 1, backgroundColor: '#000000' },
  skeletonContainer: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#2f3336',
  },
  skeletonAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  skeletonAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#16181c' },
  skeletonLine: { backgroundColor: '#16181c', borderRadius: 4 },
  skeletonCard: { backgroundColor: '#16181c', borderRadius: 12, padding: 14, marginBottom: 10 },
  emptyFlatList: { flexGrow: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { color: '#e7e9ea', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: '#71767b', fontSize: 14, lineHeight: 22, textAlign: 'center' },
});

const ss = StyleSheet.create({
  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2f3336',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  topBarAvatar: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  topBarAvatarFallback: { backgroundColor: '#1d9bf0', alignItems: 'center', justifyContent: 'center' },
  topBarAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  topBarUsername: {
    color: '#e7e9ea',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  topBarRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  brandLogo: {
    fontFamily: 'CormorantGaramond_700Bold_Italic',
    fontStyle: 'italic',
    color: '#e7e9ea',
    fontSize: 22,
    letterSpacing: 1,
  },
  topBarIcons: { flexDirection: 'row', gap: 16, alignItems: 'center' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2f3336',
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    position: 'relative',
  },
  tabLabel: { color: '#71767b', fontSize: 14, fontWeight: '500' },
  tabLabelActive: { color: '#e7e9ea', fontWeight: '700' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0, left: 16, right: 16,
    height: 3, backgroundColor: '#7c3aed', borderRadius: 1.5,
  },

  // Study banner
  studyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#16181c',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2f3336',
  },
  studyBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studyIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  studyBannerTitle: { color: '#e7e9ea', fontSize: 14, fontWeight: '600' },
  studyBannerSub: { color: '#71767b', fontSize: 12, marginTop: 1 },
  studyBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20,
  },
  studyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Quick cards
  quickCardsContainer: { borderBottomWidth: 1, borderBottomColor: '#2f3336' },
  quickCardsRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16181c',
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2f3336',
  },
  subjectChipActive: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderColor: 'rgba(124,58,237,0.4)',
  },
  subjectChipText: { color: '#71767b', fontSize: 13, fontWeight: '600' },
  subjectChipTextActive: { color: '#a78bfa' },
});
