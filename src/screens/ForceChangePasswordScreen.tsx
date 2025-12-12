import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { setNeedsPasswordChange } from '../lib/profile';

type Props = {
  navigation: any;
};

export default function ForceChangePasswordScreen({ navigation }: Props) {
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

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
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;

      // 2) Flip the flag so we don't prompt again
      await setNeedsPasswordChange(false);

      Alert.alert('Success', 'Password updated.');
      navigation.replace('Home');
    } catch (e: any) {
      Alert.alert('Failed to update password', e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Set a new password</Text>
      <Text style={{ color: '#444' }}>
        You’re using a temporary password. Please set a new one to continue.
      </Text>

      <TextInput
        placeholder="New password"
        secureTextEntry
        value={newPass}
        onChangeText={setNewPass}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Confirm new password"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <Pressable
        onPress={updatePassword}
        disabled={loading}
        style={{ backgroundColor: 'black', padding: 12, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {loading ? 'Updating…' : 'Update password'}
        </Text>
      </Pressable>
    </View>
  );
}
