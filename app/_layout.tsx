import '../global.css';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../src/services/firebase';
import { useHabitStore } from '../src/store/habitStore';

export default function RootLayout() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');
  const setUserId = useHabitStore((s) => s.setUserId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setUserId(u?.uid ?? '');
    });
    return unsubscribe;
  }, [setUserId]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      // Ignore popup-closed-by-user errors
      if (!msg.includes('popup-closed-by-user') && !msg.includes('cancelled-popup-request')) {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  // Loading
  if (user === undefined) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#1a1a1a" />
        </View>
      </SafeAreaProvider>
    );
  }

  // Not signed in — show sign-in screen
  if (!user) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
            {/* App icon / wordmark */}
            <View style={{
              width: 72, height: 72, borderRadius: 20,
              backgroundColor: '#1a1a1a',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 36 }}>✦</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 6 }}>
              Tally
            </Text>
            <Text style={{ fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 48, lineHeight: 22 }}>
              Track your habits.{'\n'}Sync across all your devices.
            </Text>

            {/* Google Sign-In button */}
            <Pressable
              onPress={handleSignIn}
              disabled={signingIn}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                width: '100%',
                maxWidth: 320,
                paddingVertical: 14,
                paddingHorizontal: 24,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: '#e5e7eb',
                backgroundColor: pressed ? '#f9fafb' : '#fff',
                opacity: signingIn ? 0.6 : 1,
              })}
            >
              {/* Google "G" mark */}
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#4285F4', letterSpacing: -0.5 }}>G</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                {signingIn ? 'Signing in…' : 'Continue with Google'}
              </Text>
            </Pressable>

            {error ? (
              <Text style={{ marginTop: 16, fontSize: 13, color: '#ef4444', textAlign: 'center' }}>
                {error}
              </Text>
            ) : null}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Signed in — render the app
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
