import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/shared/auth/authStore';
import { MainTabNavigator } from './MainTabNavigator';
import { ArielLoader } from '@/shared/components/ArielLoader';

// ─── Auth ─────────────────────────────────────────────────────────────────────
import { AuthNavigator } from '@/features/auth/AuthNavigator';
import { OnboardingScreen } from '@/features/auth/screens/OnboardingScreen';

// ─── Modal screens (presented above tabs) ────────────────────────────────────
import { ReelsScreen } from '@/features/reels/screens/ReelsScreen';
import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen';
import { DiscoverScreen } from '@/features/discover/screens/DiscoverScreen';
import { SubjectScreen } from '@/features/discover/screens/SubjectScreen';
import { MessagesNavigator } from '@/features/messages/MessagesNavigator';
import { LiveNavigator } from '@/features/live/LiveNavigator';
import { StoryViewerScreen } from '@/features/stories/screens/StoryViewerScreen';
import { StoryCreateScreen } from '@/features/stories/screens/StoryCreateScreen';
import { UserProfileScreen } from '@/features/profile/screens/UserProfileScreen';

// ─── Navigator types ──────────────────────────────────────────────────────────

export type RootStackParamList = {
  // Auth flow
  Auth: undefined;
  Onboarding: undefined;

  // Main app (tabs)
  Main: undefined;

  // Modals — presented above tabs, accessible from any tab
  Reels: undefined;
  Notifications: undefined;
  Discover: undefined;
  SubjectDetail: { subjectKey: string };
  Messages: undefined;
  Live: undefined;
  StoryViewer: { groupIndex: number };
  StoryCreate: undefined;
  UserProfile: { userId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.ReactElement {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return <ArielLoader />;
  }

  const onboardingDone = user?.onboarding_completed ?? false;

  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  if (!onboardingDone) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main tabbed app */}
      <Stack.Screen name="Main" component={MainTabNavigator} />

      {/* Full-screen modals */}
      <Stack.Screen
        name="Reels"
        component={ReelsScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="Live"
        component={LiveNavigator}
        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="StoryViewer"
        component={StoryViewerScreen}
        options={{ animation: 'fade', presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="StoryCreate"
        component={StoryCreateScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />

      {/* Push screens — slide from right */}
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="SubjectDetail"
        component={SubjectScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesNavigator}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
