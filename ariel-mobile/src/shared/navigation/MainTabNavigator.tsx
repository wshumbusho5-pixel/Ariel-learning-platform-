import React from 'react';
import { View, Text } from 'react-native';
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

// ─── Create tab (modal — launches AI card generation) ────────────────────────
function CreateScreen(): React.ReactElement {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b' }}>
      <Text style={{ color: '#fafafa', fontSize: 18, fontWeight: '600' }}>✨ Create</Text>
      <Text style={{ color: '#71717a', fontSize: 13, marginTop: 8 }}>AI card generation coming soon</Text>
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type MainTabParamList = {
  Feed: undefined;
  Deck: undefined;
  Create: undefined;
  Duels: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const ACTIVE_TINT = '#7c3aed';
const INACTIVE_TINT = '#71717a';
const TAB_BG = '#09090b';

export function MainTabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopColor: '#27272a',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      {/* Tab 1 — Feed */}
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2 — My Deck */}
      <Tab.Screen
        name="Deck"
        component={MyDeckScreen}
        options={{
          tabBarLabel: 'Deck',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 3 — Create+ (center, larger icon) */}
      <Tab.Screen
        name="Create"
        component={CreateScreen}
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 5 — Profile */}
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
