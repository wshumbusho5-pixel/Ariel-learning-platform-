import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// ─── Phase 1: Auth ────────────────────────────────────────────────────────────
// (used in RootNavigator, not tabs)

// ─── Phase 2: Core loop ───────────────────────────────────────────────────────
import { FeedScreen } from '@/features/feed/FeedScreen';
import { MyDeckScreen } from '@/features/cards/MyDeckScreen';

// ─── Phase 3: Tabs ────────────────────────────────────────────────────────────
import { DuelsNavigator } from '@/features/duels/DuelsNavigator';
import { ProfileNavigator } from '@/features/profile/ProfileNavigator';

// ─── Create tab ───────────────────────────────────────────────────────────────
import { CreateCardsScreen } from '@/features/create/CreateCardsScreen';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MainTabParamList = {
  Feed: undefined;
  Deck: undefined;
  Create: undefined;
  Duels: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const ACTIVE_TINT = '#e7e9ea';
const INACTIVE_TINT = '#536471';
const TAB_BG = '#000000';

export function MainTabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopColor: '#2f3336',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
      }}
    >
      {/* Tab 1 — Feed */}
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={color} />
          ),
        }}
      />

      {/* Tab 2 — My Deck */}
      <Tab.Screen
        name="Deck"
        component={MyDeckScreen}
        options={{
          tabBarLabel: 'Deck',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'layers' : 'layers-outline'} size={26} color={color} />
          ),
        }}
      />

      {/* Tab 3 — Create+ (center, larger icon) */}
      <Tab.Screen
        name="Create"
        component={CreateCardsScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: focused ? '#7c3aed' : '#3f3f46',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Ionicons name="add" size={26} color="#fff" />
            </View>
          ),
        }}
      />

      {/* Tab 4 — Duels */}
      <Tab.Screen
        name="Duels"
        component={DuelsNavigator}
        options={{
          tabBarLabel: 'Duels',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flash' : 'flash-outline'} size={26} color={color} />
          ),
        }}
      />

      {/* Tab 5 — Profile */}
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={26} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
