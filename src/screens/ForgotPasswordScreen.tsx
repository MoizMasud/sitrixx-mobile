// src/screens/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordScreen({ navigation, route }: any) {
  const [email, setEmail] = useState((route?.params?.email || '').toString());
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    const e = email.trim().toLowerCase();
    if (!e) {
      Alert.alert('Enter your email', 'Type your email address to get a reset code.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: { shouldCreateUser: false },
      });

      if (error) throw error;

      Alert.alert('Check your email', 'We sent a login code (or link) to your email.');
      navigation.navigate('VerifyCode', { email: e });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', textAlign: 'center' }}>
          Reset your password
        </Text>

        <Text style={{ marginTop: 10, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
          Enter your account email. We’ll send you a verification code to continue.
        </Text>

        <View style={{ marginTop: 22 }}>
          <Text style={{ marginBottom: 6, fontWeight: '600' }}>Email</Text>
          <TextInput
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={{
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 16,
              backgroundColor: '#FFFFFF',
            }}
          />

          <Pressable
            onPress={sendCode}
            disabled={loading}
            style={{
              marginTop: 14,
              backgroundColor: '#7C3AED',
              paddingVertical: 14,
              borderRadius: 999,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
              {loading ? 'Sending…' : 'Send code'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={{ marginTop: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#4A00FF', fontWeight: '600' }}>Back to login</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
