// src/screens/DashboardScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

const SITRIXX_BG = '#050816';
const SITRIXX_CARD = '#111827';
const SITRIXX_PURPLE = '#7b3ff2';

export const DashboardScreen: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Sitrixx Dashboard</Text>
        <Text style={styles.subtitle}>
          You are logged in. This will show leads & reviews.
        </Text>

        <TouchableOpacity style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SITRIXX_BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: SITRIXX_CARD,
    padding: 24,
    borderRadius: 24,
  },
  title: {
    color: '#f9fafb',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
    marginBottom: 24,
  },
  button: {
    backgroundColor: SITRIXX_PURPLE,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 16,
  },
});
