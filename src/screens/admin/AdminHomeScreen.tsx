// src/screens/admin/AdminHomeScreen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminHomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin</Text>
      <Text style={styles.subtitle}>Manage businesses and users.</Text>

      <Pressable
        onPress={() => navigation.navigate('AdminClients')}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      >
        <View style={styles.row}>
          <Ionicons name="business-outline" size={22} color="#111827" />
          <Text style={styles.cardTitle}>Businesses</Text>
        </View>
        <Text style={styles.cardDesc}>Create, edit, delete businesses and manage users.</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#111827' },
  subtitle: { color: '#6B7280' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
  cardDesc: { marginTop: 6, color: '#6B7280' },
});
