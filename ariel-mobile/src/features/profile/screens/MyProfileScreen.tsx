import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/shared/auth/useAuth';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { UserDeckGrid } from '@/features/profile/components/UserDeckGrid';
import { getMyDecks } from '@/features/profile/api/profileApi';
import type { ProfileStackParamList } from '@/features/profile/ProfileNavigator';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;
type Tab = 'grid' | 'saved' | 'stats';

// ─── Icon tab bar ──────────────────────────────────────────────────────────────

function IconTabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; icon: string; iconActive: string }[] = [
    { key: 'grid',  icon: 'grid-outline',     iconActive: 'grid' },
    { key: 'saved', icon: 'bookmark-outline', iconActive: 'bookmark' },
    { key: 'stats', icon: 'bar-chart-outline',iconActive: 'bar-chart' },
  ];

  return (
    <View style={ts.bar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[ts.tab, active === tab.key && ts.tabActive]}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={(active === tab.key ? tab.iconActive : tab.icon) as any}
            size={24}
            color={active === tab.key ? '#fafafa' : '#71717a'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const ts = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#262626',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 1,
    borderBottomColor: '#fafafa',
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MyProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: decks = [], isLoading: decksLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.PROFILE.me(),
    queryFn: getMyDecks,
    enabled: Boolean(user),
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  if (!user) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  const isPremium = user.role === 'premium' || user.role === 'admin';
  const handle = user.username ?? `user_${(user.id ?? '').slice(0, 8)}`;

  const header = (
    <>
      <ProfileHeader
        userId={user.id ?? ''}
        username={user.username}
        fullName={user.full_name}
        bio={user.bio}
        school={(user as any).school}
        profilePicture={user.profile_picture}
        cardsCount={decks.length}
        followersCount={user.followers_count ?? 0}
        followingCount={user.following_count ?? 0}
        streak={user.current_streak ?? 0}
        level={user.level ?? 1}
        isPremium={isPremium}
        isOwnProfile
        onEditPress={() => navigation.navigate('EditProfile')}
        onFollowersPress={() =>
          navigation.navigate('Followers', { userId: user.id ?? '' })
        }
        onFollowingPress={() =>
          navigation.navigate('Following', { userId: user.id ?? '' })
        }
      />
      <IconTabBar active={activeTab} onChange={setActiveTab} />
    </>
  );

  // Grid tab: FlatList with 3-column decks
  if (activeTab === 'grid') {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <TopBar handle={handle} onSettings={() => navigation.navigate('Settings')} />
        <UserDeckGrid
          decks={decks}
          isLoading={decksLoading}
          ListHeaderComponent={header}
        />
      </View>
    );
  }

  // Other tabs: scrollable
  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <TopBar handle={handle} onSettings={() => navigation.navigate('Settings')} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#7c3aed"
          />
        }
      >
        {header}
        {activeTab === 'saved' && (
          <View style={s.placeholder}>
            <Text style={s.placeholderIcon}>🔖</Text>
            <Text style={s.placeholderTitle}>Saved cards</Text>
            <Text style={s.placeholderSub}>Cards you save will appear here.</Text>
          </View>
        )}
        {activeTab === 'stats' && (
          <TouchableOpacity
            style={s.placeholder}
            onPress={() => navigation.navigate('Stats')}
            activeOpacity={0.7}
          >
            <Text style={s.placeholderIcon}>📊</Text>
            <Text style={s.placeholderTitle}>Your stats</Text>
            <Text style={s.placeholderSub}>Tap to view detailed analytics →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({ handle, onSettings }: { handle: string; onSettings: () => void }) {
  return (
    <View style={s.topBar}>
      <View style={{ width: 40 }} />
      <Text style={s.topBarHandle}>@{handle}</Text>
      <View style={s.topBarRight}>
        <TouchableOpacity onPress={onSettings} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="menu-outline" size={26} color="#fafafa" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topBarHandle: {
    color: '#fafafa',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: 40,
    justifyContent: 'flex-end',
  },

  // Placeholder tabs
  placeholder: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  placeholderIcon: { fontSize: 44 },
  placeholderTitle: { color: '#fafafa', fontSize: 16, fontWeight: '700' },
  placeholderSub: { color: '#71717a', fontSize: 13 },
});
