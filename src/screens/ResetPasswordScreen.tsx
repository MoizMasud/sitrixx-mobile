// src/screens/ResetPasswordScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handleUrl = async (url: string) => {
      try {
        // Supabase mobile deep links often come as "code" flow
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);
        if (error) {
          // Some setups won’t use code exchange; still allow user to try if session already exists

        } else {

        }
      } finally {
        setReady(true);
      }
    };

    // initial url
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
      else setReady(true);
    });

    // subsequent opens
    const sub = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => sub.remove();
  }, []);

  const onSave = async () => {
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Success', 'Password updated. You can now log in.');
  };

  if (!ready) return <Text>Loading reset flow...</Text>;

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Reset Password</Text>

      <TextInput
        placeholder="New password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <Button title="Save New Password" onPress={onSave} />
    </View>
  );
}
