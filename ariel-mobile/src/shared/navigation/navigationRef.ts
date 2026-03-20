import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import type { RootStackParamList } from './RootNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Imperative navigation — usable outside React tree (e.g. push notification handlers).
 * Type-safe: screen name and params are checked against RootStackParamList.
 */
export function navigate<K extends keyof RootStackParamList>(
  name: K,
  params?: RootStackParamList[K],
): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.navigate({ name, params } as any),
    );
  }
}

export function goBack(): void {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function resetToMain(): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }),
    );
  }
}
