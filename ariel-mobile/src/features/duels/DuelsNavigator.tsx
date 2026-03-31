import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DuelsLobbyScreen } from '@/features/duels/screens/DuelsLobbyScreen';
import { DuelRoomScreen } from '@/features/duels/screens/DuelRoomScreen';
import { DuelResultScreen } from '@/features/duels/screens/DuelResultScreen';
import { BotDuelScreen } from '@/features/duels/screens/BotDuelScreen';

// ─── Param list ───────────────────────────────────────────────────────────────

export type DuelsStackParamList = {
  DuelsLobby: undefined;
  DuelRoom: { roomId: string };
  DuelResult: {
    result: any;
    opponentUsername?: string;
    subject?: string;
    totalRounds?: number;
  };
  BotDuel: { rounds: number };
};

// ─── Navigator ────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<DuelsStackParamList>();

export function DuelsNavigator(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DuelsLobby" component={DuelsLobbyScreen} />
      <Stack.Screen name="DuelRoom" component={DuelRoomScreen} />
      <Stack.Screen name="DuelResult" component={DuelResultScreen} />
      <Stack.Screen name="BotDuel" component={BotDuelScreen} />
    </Stack.Navigator>
  );
}
