import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AuthStackParamList } from '../AuthNavigator';
import { authApi } from '../api/authApi';
import { useAuthStore } from '@/shared/auth/authStore';
import { ArielWordmark } from '@/shared/components/ArielWordmark';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props): React.ReactElement {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const isShort = H < 720;
  const loginStore = useAuthStore((s) => s.login);

  const [, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken;
      if (token) {
        handleGoogleToken(token);
      }
    }
  }, [response]);

  const handleGoogleToken = async (token: string) => {
    setGoogleLoading(true);
    try {
      const res = await authApi.oauthLogin('google', token);
      await loginStore(res.access_token, res.user);
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Google sign-in failed.';
      Alert.alert('Sign-in failed', msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Please check your password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        username: username.trim() || undefined,
      });
      await loginStore(res.access_token, res.user);
    } catch (err: any) {
      console.error('Registration error:', JSON.stringify(err?.response?.data ?? err?.message ?? err, null, 2));
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg).join('\n')
          : err?.message === 'Network Error'
          ? `Cannot reach server at ${process.env.EXPO_PUBLIC_API_BASE_URL}. Check that the backend is running.`
          : 'Registration failed. Please try again.';
      Alert.alert('Sign up failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { paddingTop: insets.top + (isShort ? 8 : 16), paddingBottom: isShort ? 20 : 40 }]}>
          <TouchableOpacity style={[styles.backBtn, { marginBottom: isShort ? 12 : 24 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={[styles.headerBlock, { marginBottom: isShort ? 16 : 32 }]}>
            <ArielWordmark size={isShort ? 28 : 34} />
            <Text style={[styles.title, { fontSize: isShort ? 22 : 28 }]}>Create account</Text>
            <Text style={styles.subtitle}>Join thousands of learners</Text>
          </View>

          {/* Google Sign-Up */}
          <TouchableOpacity
            style={[styles.googleBtn, { marginBottom: isShort ? 10 : 20 }]}
            onPress={() => promptAsync()}
            disabled={googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color="#1a1a1a" />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://www.google.com/favicon.ico' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={[styles.divider, { marginBottom: isShort ? 10 : 20 }]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={[styles.form, { gap: isShort ? 12 : 16 }]}>
            <FieldGroup label="Full name" required>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#52525b"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </FieldGroup>

            <FieldGroup label="Username" optional>
              <TextInput
                style={styles.input}
                placeholder="@username"
                placeholderTextColor="#52525b"
                value={username}
                onChangeText={(t) => setUsername(t.replace(/\s/g, ''))}
                autoCapitalize="none"
                returnKeyType="next"
              />
            </FieldGroup>

            <FieldGroup label="Email" required>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#52525b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />
            </FieldGroup>

            <FieldGroup label="Password" required>
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                placeholderTextColor="#52525b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
              />
            </FieldGroup>

            <FieldGroup label="Confirm password" required>
              <TextInput
                style={styles.input}
                placeholder="Repeat password"
                placeholderTextColor="#52525b"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </FieldGroup>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Create account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.footer, { marginTop: isShort ? 12 : 32 }]}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldGroup({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={{ color: '#ef4444', marginLeft: 3 }}>*</Text>}
        {optional && <Text style={{ color: '#71717a', marginLeft: 4, fontSize: 12 }}>(optional)</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    // paddingBottom applied inline (isShort-aware)
  },
  backBtn: {
    // marginBottom applied inline (isShort-aware)
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#8b5cf6',
    fontSize: 15,
  },
  headerBlock: {
    // marginBottom applied inline (isShort-aware)
  },
  title: {
    // fontSize applied inline (isShort-aware)
    fontWeight: '700',
    color: '#fafafa',
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 14,
    marginTop: 4,
  },
  // Google button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    gap: 10,
    // marginBottom applied inline (isShort-aware)
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleBtnText: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // marginBottom applied inline (isShort-aware)
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#27272a',
  },
  dividerText: {
    color: '#52525b',
    fontSize: 13,
  },

  form: {
    // gap applied inline (isShort-aware)
  },
  label: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fafafa',
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    // marginTop applied inline (isShort-aware)
  },
  footerText: {
    color: '#71717a',
    fontSize: 14,
  },
  footerLink: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 14,
  },
});
