import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MyProfileScreen } from '@/features/profile/screens/MyProfileScreen';
import { UserProfileScreen } from '@/features/profile/screens/UserProfileScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { FollowersScreen } from '@/features/profile/screens/FollowersScreen';
import { FollowingScreen } from '@/features/profile/screens/FollowingScreen';
import { SettingsScreen } from '@/features/profile/screens/SettingsScreen';

// ─── Param List ───────────────────────────────────────────────────────────────

export type ProfileStackParamList = {
  MyProfile: undefined;
  UserProfile: { userId: string };
  EditProfile: undefined;
  Followers: { userId: string };
  Following: { userId: string };
  Settings: undefined;
};

// ─── Navigator ────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="MyProfile"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#09090b' },
      }}
    >
      <Stack.Screen name="MyProfile" component={MyProfileScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Followers" component={FollowersScreen} />
      <Stack.Screen name="Following" component={FollowingScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
