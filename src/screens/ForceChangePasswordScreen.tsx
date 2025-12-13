// src/screens/ForceChangePasswordScreen.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ForceChangePasswordScreen() {
  const { refreshProfile, signOut, profile, session } = useAuth();

  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const uid = useMemo(() => session?.user?.id ?? null, [session]);



  const updatePassword = async () => {
    if (!newPass || newPass.length < 8) {
      return Alert.alert('Password too short', 'Use at least 8 characters.');
    }
    if (newPass !== confirm) {
      return Alert.alert('Passwords do not match', 'Please confirm your password.');
    }

    setLoading(true);
    try {


      // 1) Update auth password
      const { error: passErr } = await supabase.auth.updateUser({ password: newPass });

      if (passErr) throw passErr;

      // 2) Flip needs_password_change off in profiles
      if (!uid) throw new Error('No user id in session');


      const { data: updData, error: updErr } = await supabase
        .from('profiles')
        .update({
          needs_password_change: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', uid)
        .select('id, needs_password_change');


      if (updErr) throw updErr;

      // 3) Immediately re-select to confirm DB value changed
      const { data: checkData, error: checkErr } = await supabase
        .from('profiles')
        .select('id, needs_password_change')
        .eq('id', uid)
        .single();


      if (checkErr) throw checkErr;

      // 4) Pull fresh profile into context so RootNavigator routes correctly
      await refreshProfile();

      Alert.alert('Success', 'Password updated.');
    } catch (e: any) {
      console.warn('[FORCE CHANGE] Failed:', e);

      const msg =
        e?.message ||
        e?.error_description ||
        'Unknown error';

      // helpful common case
      if (String(msg).includes('different from the old password')) {
        Alert.alert(
          'Choose a new password',
          'Your new password must be different from your temporary password.',
        );
      } else if (String(msg).toLowerCase().includes('permission')) {
        Alert.alert(
          'Permission error',
          'Your app cannot update your profile. Add an UPDATE RLS policy on profiles for auth.uid() = id.',
        );
      } else {
        Alert.alert('Failed to update password', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 6 }}>
        Set a new password
      </Text>
      <Text style={{ color: '#444', marginBottom: 14 }}>
        You’re using a temporary password. Please set a new one to continue.
      </Text>

      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>New password</Text>
      <TextInput
        placeholder="Minimum 8 characters"
        secureTextEntry
        value={newPass}
        onChangeText={setNewPass}
        style={{
          borderWidth: 1,
          borderColor: '#E5E7EB',
          padding: 12,
          borderRadius: 12,
          backgroundColor: '#F9FAFB',
          marginBottom: 10,
        }}
      />

      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Confirm password</Text>
      <TextInput
        placeholder="Confirm new password"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        style={{
          borderWidth: 1,
          borderColor: '#E5E7EB',
          padding: 12,
          borderRadius: 12,
          backgroundColor: '#F9FAFB',
          marginBottom: 14,
        }}
      />

      <Pressable
        onPress={updatePassword}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#9CA3AF' : '#7C3AED',
          paddingVertical: 14,
          borderRadius: 999,
          alignItems: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '900' }}>Update password</Text>
        )}
      </Pressable>

      <Pressable onPress={signOut} disabled={loading} style={{ marginTop: 12, alignItems: 'center' }}>
        <Text style={{ color: '#6B7280', textDecorationLine: 'underline' }}>
          Logout
        </Text>
      </Pressable>
    </View>
  );
}
