// src/screens/VerifyCodeScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function VerifyCodeScreen({ route, navigation }: any) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: 'email',
      });

      if (error) throw error;

      // Now we have a session → go set new password
      navigation.replace('ResetPassword');
    } catch (e: any) {
      Alert.alert('Invalid code', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: '#FFFFFF',
    }}
  >
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
        Enter code
      </Text>

      <Text style={{ textAlign: 'center', color: '#6B7280' }}>
        We emailed a code to {email}
      </Text>

      <TextInput
        placeholder="Code"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        style={{
          borderWidth: 1,
          borderColor: '#E5E7EB',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          textAlign: 'center',
          fontSize: 18,
          letterSpacing: 4,
        }}
      />

      <Pressable
        onPress={verify}
        disabled={loading}
        style={{
          marginTop: 8,
          backgroundColor: '#7C3AED',
          paddingVertical: 14,
          borderRadius: 999,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
          {loading ? 'Verifying…' : 'Verify code'}
        </Text>
      </Pressable>
    </View>
  </View>
);

}
