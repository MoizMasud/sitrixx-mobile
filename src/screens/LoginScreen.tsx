// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    // OTP reset flow: send code from ForgotPasswordScreen
    navigation.navigate('ForgotPassword', { email });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 96, height: 96, borderRadius: 24, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 24, fontWeight: '700' }}>Sitrixx Leads</Text>
          <Text
            style={{
              fontSize: 14,
              color: '#6B7280',
              marginTop: 4,
              textAlign: 'center',
            }}
          >
            Log in to see all your calls, form submissions and review requests in one place.
          </Text>
        </View>

        <Text style={{ marginBottom: 4, fontWeight: '500' }}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 12,
            marginBottom: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />

        <Text style={{ marginBottom: 4, fontWeight: '500' }}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 12,
            marginBottom: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />

        <TouchableOpacity
          onPress={handleForgotPassword}
          style={{ alignSelf: 'flex-end', paddingVertical: 6 }}
        >
          <Text style={{ color: '#4A00FF' }}>Forgot password?</Text>
        </TouchableOpacity>

        {errorMsg ? <Text style={{ color: '#EF4444', marginBottom: 8 }}>{errorMsg}</Text> : null}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={submitting}
          style={{
            marginTop: 8,
            backgroundColor: '#7C3AED',
            paddingVertical: 14,
            borderRadius: 999,
            alignItems: 'center',
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Log in</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
