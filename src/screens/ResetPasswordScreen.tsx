// src/screens/ResetPasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen({ navigation }: any) {
  const [password, setPassword] = useState('');

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
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

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
