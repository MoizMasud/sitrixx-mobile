// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const SettingsScreen: React.FC = () => {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign out',
      'Do you want to sign out and switch accounts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await signOut();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to sign out');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6', padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 6 }}>
        Settings
      </Text>
      <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
        Manage your account and switch users.
      </Text>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 14,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Pressable
          onPress={handleSignOut}
          disabled={loading}
          style={({ pressed }) => [
            {
              borderRadius: 999,
              paddingVertical: 12,
              alignItems: 'center',
              backgroundColor: '#EF4444',
              opacity: pressed ? 0.9 : 1,
            },
            loading ? { backgroundColor: '#9CA3AF' } : null,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
              Sign out / Switch account
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};
