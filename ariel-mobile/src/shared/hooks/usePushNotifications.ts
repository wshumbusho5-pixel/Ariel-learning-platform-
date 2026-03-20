import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import apiClient from '@/shared/api/client';
import { AUTH } from '@/shared/api/endpoints';

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

    return () => {
      isMounted = false;
    };
  }, []);

  return { expoPushToken, notificationPermission };
}
