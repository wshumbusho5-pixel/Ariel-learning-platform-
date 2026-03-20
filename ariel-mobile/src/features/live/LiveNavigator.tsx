import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LiveListScreen } from '@/features/live/screens/LiveListScreen';
import { LiveViewerScreen } from '@/features/live/screens/LiveViewerScreen';
import { LiveHostScreen } from '@/features/live/screens/LiveHostScreen';

// ─── Param list ───────────────────────────────────────────────────────────────

export type LiveStackParamList = {
  LiveList: undefined;
  LiveViewer: { streamId: string };
  LiveHost: undefined;
};

// ─── Navigator ────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<LiveStackParamList>();

export function LiveNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="LiveList"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="LiveList" component={LiveListScreen} />
      <Stack.Screen
        name="LiveViewer"
        component={LiveViewerScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="LiveHost"
        component={LiveHostScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
