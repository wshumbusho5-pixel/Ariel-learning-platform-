import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConversationsScreen } from '@/features/messages/screens/ConversationsScreen';
import { ChatScreen } from '@/features/messages/screens/ChatScreen';
import { NewMessageScreen } from '@/features/messages/screens/NewMessageScreen';

// ─── Param list ───────────────────────────────────────────────────────────────

export type MessagesStackParamList = {
  Conversations: undefined;
  Chat: {
    conversationId?: string;
    otherUserId: string;
    otherUsername: string;
    otherProfilePicture?: string;
  };
  NewMessage: undefined;
};

// ─── Navigator ────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="Conversations"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#09090b' },
      }}
    >
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen
        name="NewMessage"
        component={NewMessageScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
