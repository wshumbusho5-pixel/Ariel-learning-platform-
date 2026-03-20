import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './useAuth';
import { ArielLoader } from '@/shared/components/ArielLoader';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps): React.ReactElement | null {
  const { isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Navigate to auth stack — feature agents will wire exact screen name
      navigation.navigate('Auth' as never);
    }
  }, [isAuthenticated, isLoading, navigation]);

  if (isLoading) {
    return <ArielLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
