import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@ariel/auth_token',
  USER: '@ariel/user',
  FEED_CACHE: '@ariel/feed_cache',
  ONBOARDING_STEP: '@ariel/onboarding_step',
  PUSH_TOKEN: '@ariel/push_token',
  NOTIFICATION_PREFS: '@ariel/notification_prefs',
  LAST_ACTIVE: '@ariel/last_active',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export async function getItem<T>(key: StorageKey): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setItem<T>(key: StorageKey, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage write failed — non-critical, continue
  }
}

export async function removeItem(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

export async function clear(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS) as string[];
    await AsyncStorage.multiRemove(keys);
  } catch {
    // Ignore
  }
}
