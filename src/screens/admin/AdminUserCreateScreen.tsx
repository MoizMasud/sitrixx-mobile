import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClientApi, ClientInfo } from '../../api/clientApi';

function getClipboardModule(): any | null {
  try {
    // Optional dependency: expo-clipboard
    // If not installed, we gracefully fallback without breaking the build
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-clipboard');
  } catch {
    return null;
  }
}

export default function AdminUserCreateScreen({ route, navigation }: any) {
  const api = useClientApi();
  const client: ClientInfo | undefined = route.params?.client;

  const header = useMemo(
    () => client?.business_name || 'Business',
    [client?.business_name],
  );

  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const copyTempPassword = async () => {
    const pw = tempPassword.trim();
    if (!pw) {
      Alert.alert('Nothing to copy', 'Enter a temporary password first.');
      return;
    }

    const Clipboard = getClipboardModule();
    if (!Clipboard?.setStringAsync) {
      Alert.alert(
        'Copy not available',
        'Install clipboard support:\n\nnpx expo install expo-clipboard\n\nThen reload the app.',
      );
      return;
    }

    await Clipboard.setStringAsync(pw);
    Alert.alert('Copied', 'Temporary password copied.');
  };

  const create = async () => {
    try {
      const e = email.trim().toLowerCase();
      const pw = tempPassword.trim();

      if (!client?.id) {
        Alert.alert('Error', 'Missing business');
        return;
      }

      if (!e) {
        Alert.alert('Missing', 'Email is required');
        return;
      }

      // optional but recommended: enforce min length if provided
      if (pw && pw.length < 8) {
        Alert.alert('Too short', 'Temporary password must be at least 8 characters.');
        return;
      }

      setSaving(true);

      console.log('[AdminUserCreate] POST payload', {
        email: e,
        clientId: client.id,
        hasTempPassword: !!pw,
      });

      const body: any = await api.adminUsersApi('POST', undefined, {
        email: e,
        clientId: client.id,
        tempPassword: pw || undefined, // backend will auto-generate if undefined
        role: 'client',
      });

      console.log('[AdminUserCreate] response', body);

      if (!body?.ok) throw new Error(body?.error || 'Failed to create user');

      Alert.alert('Created', 'User created and linked to this business.');
      // Go back to users list; it should refresh on focus
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add user</Text>
      <Text style={styles.subtitle}>{header}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="user@business.com"
          style={styles.input}
        />

        <Text style={styles.label}>Temporary password (optional)</Text>
        <Text style={styles.hint}>
          If you leave it blank, we auto-generate one. User will be forced to change on first login.
        </Text>

        <View style={styles.row}>
          <TextInput
            value={tempPassword}
            onChangeText={setTempPassword}
            autoCapitalize="none"
            placeholder="(optional)"
            style={[styles.input, styles.inputFlex]}
            secureTextEntry={false}
          />

          <Pressable
            onPress={copyTempPassword}
            style={({ pressed }) => [
              styles.copyBtn,
              pressed && { opacity: 0.92 },
            ]}
          >
            <Ionicons name="copy-outline" size={16} color="#111827" />
            <Text style={styles.copyBtnText}>Copy</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={create}
        disabled={saving}
        style={({ pressed }) => [
          styles.primaryBtn,
          saving && { backgroundColor: '#9CA3AF' },
          pressed && !saving && { opacity: 0.92 },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Create user</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => navigation.goBack()}
        disabled={saving}
        style={({ pressed }) => [
          styles.secondaryBtn,
          pressed && !saving && { opacity: 0.92 },
          saving && { opacity: 0.6 },
        ]}
      >
        <Text style={styles.secondaryBtnText}>Cancel</Text>
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

  label: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '900',
  },
  hint: { color: '#6B7280', fontSize: 12, marginBottom: 8 },

  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    fontSize: 14,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputFlex: { flex: 1 },

  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  copyBtnText: { fontWeight: '900', color: '#111827' },

  primaryBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  secondaryBtn: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
