import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import apiClient from '@/shared/api/client';
import { navigate } from '@/shared/navigation/navigationRef';
import { AUTH } from '@/shared/api/endpoints';
import { useNotificationStore } from '@/features/notifications/notificationStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface UsePushNotificationsReturn {
  expoPushToken: string | null;
  notificationPermission: Notifications.PermissionStatus | null;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<Notifications.PermissionStatus | null>(null);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    let isMounted = true;

    async function register(): Promise<void> {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (isMounted) {
        setNotificationPermission(finalStatus);
      }

      if (finalStatus !== 'granted') return;

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        if (isMounted) {
          setExpoPushToken(token);
        }

        // Send token to backend
        await apiClient.put(AUTH.PROFILE, { expo_push_token: token });
      } catch {
        // Non-critical: push token registration failed, app still works
      }
    }

    register();

    // Foreground: increment badge count when a notification arrives
    notificationListener.current = Notifications.addNotificationReceivedListener(
      () => {
        const store = useNotificationStore.getState();
        store.setUnreadCount(store.unreadCount + 1);
      },
    );

    // Tap: deep-link when user taps a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        if (!data) return;

        const type = data.type as string | undefined;
        const targetId = data.target_id as string | undefined;

        switch (type) {
          case 'new_follower':
          case 'follow_request':
            if (targetId) navigate('UserProfile', { userId: targetId });
            break;
          case 'duel_challenge':
          case 'duel_result':
            navigate('Main');
            break;
          case 'new_message':
            navigate('Messages');
            break;
          default:
            navigate('Notifications');
            break;
        }
      },
    );

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return { expoPushToken, notificationPermission };
}
