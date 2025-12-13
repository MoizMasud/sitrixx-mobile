// src/screens/admin/AdminUserEditScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useClientApi, ClientInfo } from '../../api/clientApi';

export default function AdminUserEditScreen({ route, navigation }: any) {
  const { adminUsersApi } = useClientApi();
  const client: ClientInfo | undefined = route.params?.client;
  const user = route.params?.user;

  const [display_name, setDisplayName] = useState(user?.display_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    try {
      if (!user?.id) return Alert.alert('Error', 'Missing user id');

      setSaving(true);

      const body: any = await adminUsersApi('PATCH', undefined, {
        userId: user.id,
        display_name: display_name.trim() || null,
        phone: phone.trim() || null,
        // role intentionally not editable
      });

      if (!body?.ok) throw new Error(body?.error || 'Failed to update user');

      Alert.alert('Saved', 'User updated.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!user?.id) return;
    Alert.alert(
      'Delete user?',
      'This permanently deletes the user and removes their access.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ],
    );
  };

  const doDelete = async () => {
    try {
      if (!user?.id) return;
      setDeleting(true);

      const body: any = await adminUsersApi('DELETE', undefined, { userId: user.id });
      if (!body?.ok) throw new Error(body?.error || 'Failed to delete user');

      Alert.alert('Deleted', 'User removed.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit user</Text>
      <Text style={styles.subtitle}>{client?.business_name || '—'}</Text>

      <View style={styles.card}>
        <Text style={styles.k}>Email</Text>
        <Text style={styles.v}>{user?.email}</Text>

        <Text style={[styles.k, { marginTop: 12 }]}>Display name</Text>
        <TextInput
          value={display_name}
          onChangeText={setDisplayName}
          style={styles.input}
          placeholder="Full name"
        />

        <Text style={[styles.k, { marginTop: 12 }]}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          placeholder="+15195551234"
          keyboardType="phone-pad"
        />
      </View>

      <Pressable
        onPress={save}
        disabled={saving || deleting}
        style={({ pressed }) => [styles.primaryBtn, (saving || deleting) && { backgroundColor: '#9CA3AF' }, pressed && !(saving || deleting) && { opacity: 0.92 }]}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save</Text>}
      </Pressable>

      <Pressable
        onPress={confirmDelete}
        disabled={saving || deleting}
        style={({ pressed }) => [styles.dangerBtn, (saving || deleting) && { opacity: 0.6 }, pressed && !(saving || deleting) && { opacity: 0.92 }]}
      >
        {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.dangerBtnText}>Delete User</Text>}
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
  k: { fontSize: 12, color: '#6B7280', fontWeight: '900' },
  v: { marginTop: 4, color: '#111827', fontWeight: '900' },

  input: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },

  primaryBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  dangerBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
