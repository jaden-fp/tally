import '../global.css';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../src/services/firebase';
import { useHabitStore } from '../src/store/habitStore';

export default function RootLayout() {
  const [authReady, setAuthReady] = useState(false);
  const setUserId = useHabitStore((s) => s.setUserId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setAuthReady(true);
      } else {
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged will fire again with the new user
        } catch (err) {
          console.error('[Auth] Anonymous sign-in failed:', err);
          setAuthReady(true); // show app even if auth fails
        }
      }
    });

    return unsubscribe;
  }, [setUserId]);

  if (!authReady) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
          }}
        >
          <ActivityIndicator size="large" color="#1a1a1a" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
