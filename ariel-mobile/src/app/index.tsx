import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { RootNavigator } from '@/shared/navigation/RootNavigator';
import { navigationRef } from '@/shared/navigation/navigationRef';
import { linking } from '@/shared/navigation/linking';
import { ToastProvider } from '@/shared/components/ToastProvider';
import { usePushNotifications } from '@/shared/hooks/usePushNotifications';
import { syncIfOnline } from '@/shared/offline/reviewQueue';
import {
  useFonts,
  CormorantGaramond_700Bold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import { Kalam_400Regular, Kalam_700Bold } from '@expo-google-fonts/kalam';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30 seconds
      gcTime: 24 * 60 * 60 * 1000, // 24 hours (persisted cache needs longer gcTime)
      retry: 2,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: '@ariel/react-query-cache',
});

function PushNotificationRegistrar(): null {
  usePushNotifications();
  return null;
}

/** Flush offline review queue when the app comes back online or foregrounds */
function OfflineSyncManager(): null {
  useEffect(() => {
    // Sync on mount
    syncIfOnline();

    // Sync when app returns to foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') syncIfOnline();
    });

    // Sync when connectivity is restored
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) syncIfOnline();
    });

    return () => {
      sub.remove();
      unsub();
    };
  }, []);
  return null;
}

export default function App(): React.ReactElement {
  const [fontsLoaded] = useFonts({ CormorantGaramond_700Bold_Italic, Kalam_400Regular, Kalam_700Bold });
  // Render app regardless — fonts will swap in once loaded
  void fontsLoaded;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
          <NavigationContainer ref={navigationRef} linking={linking} theme={DarkTheme}>
            <ToastProvider>
              <PushNotificationRegistrar />
              <OfflineSyncManager />
              <RootNavigator />
            </ToastProvider>
          </NavigationContainer>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
