// src/screens/SettingsScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useClientApi, ClientInfo } from '../api/clientApi';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export const SettingsScreen: React.FC = () => {
  const api = useClientApi();
  const { signOut, profile } = useAuth();
  const navigation = useNavigation<any>();

  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [client, setClient] = useState<ClientInfo | null>(null);
  const [noClient, setNoClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [twilioNumber, setTwilioNumber] = useState('');
  const [forwardingPhone, setForwardingPhone] = useState('');
  const [bookingLink, setBookingLink] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');

  const load = useCallback(async (opts?: { showSpinner?: boolean }) => {
    const showSpinner = opts?.showSpinner ?? true;

    if (showSpinner) setLoading(true);
    setError(null);
    setNoClient(false);

    try {
      const info = await apiRef.current.getClientInfo();

      if (!isMountedRef.current) return;

      if (!info) {
        setClient(null);
        setNoClient(true);
        return;
      }

      setClient(info);

      setTwilioNumber(info.twilio_number || '');
      setForwardingPhone(info.forwarding_phone || '');
      setBookingLink(info.booking_link || '');
      setGoogleReviewLink(info.google_review_link || '');
    } catch (e: any) {
      if (!isMountedRef.current) return;
      setError(e?.message || 'Failed to load settings');
      setClient(null);
    } finally {
      if (!isMountedRef.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    if (!client) return;

    const tn = twilioNumber.trim();
    const fp = forwardingPhone.trim();
    const bl = bookingLink.trim();
    const gr = googleReviewLink.trim();

    try {
      setSaving(true);
      setError(null);

      await apiRef.current.updateClientInfo({
        id: client.id,
        twilio_number: tn || null,
        forwarding_phone: fp || null,
        booking_link: bl || null,
        google_review_link: gr || null,
      });

      Alert.alert('Saved', 'Your settings have been updated.');
      await load({ showSpinner: false });
    } catch (e: any) {
      setError(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const goAdmin = () => {
    navigation.navigate('Main', { screen: 'Admin' });
  };

  const confirmLogout = () => {
    Alert.alert('Logout?', 'You will need to sign in again to access your dashboard.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: signOut },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.centerText}>Loading settings…</Text>
      </View>
    );
  }

  // ✅ Shared "Account" footer section for all states
  const AccountFooter = (
    <View style={styles.accountCard}>
      <View style={styles.accountHeader}>
        <View style={styles.accountIconWrap}>
          <Ionicons name="person-circle-outline" size={26} color="#111827" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.accountTitle}>Account</Text>
          <Text style={styles.accountDesc}>
            {profile?.email ? `Signed in as ${profile.email}` : 'Signed in'}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={confirmLogout}
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.92 }]}
      >
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.logoutBtnText}>Logout</Text>
      </Pressable>

    </View>
  );

  if (noClient) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.emptyTitle}>No business found</Text>
        <Text style={styles.emptyDesc}>
          No client found for this account. Ask an admin to link your user to a business.
        </Text>

        <Pressable onPress={() => load()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>

        {profile?.role === 'admin' ? (
          <Pressable onPress={goAdmin} style={styles.adminButton}>
            <Text style={styles.adminButtonText}>Open Admin Panel</Text>
          </Pressable>
        ) : null}

        {/* ✅ Big, clear logout */}
        {AccountFooter}
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.emptyTitle}>Couldn’t load</Text>
        <Text style={styles.emptyDesc}>{error || 'Unknown error'}</Text>

        <Pressable onPress={() => load()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>

        {profile?.role === 'admin' ? (
          <Pressable onPress={goAdmin} style={styles.adminButton}>
            <Text style={styles.adminButtonText}>Open Admin Panel</Text>
          </Pressable>
        ) : null}

        {/* ✅ Big, clear logout */}
        {AccountFooter}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Update your business links + phone settings. (These affect automations.)
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* ✅ Admin Panel Card */}
      {profile?.role === 'admin' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin</Text>
          <Text style={styles.cardDesc}>
            Create businesses, add users, and assign users to a business.
          </Text>

          <Pressable
            onPress={goAdmin}
            style={({ pressed }) => [styles.adminButtonInline, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.adminButtonInlineText}>Open Admin Panel</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Business</Text>
        <Text style={styles.cardDesc}>This is your connected business.</Text>

        <View style={{ marginTop: 10 }}>
          <Text style={styles.kvLabel}>Business name</Text>
          <Text style={styles.kvValue}>{client.business_name}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Phone</Text>
        <Text style={styles.label}>Forwarding phone</Text>
        <TextInput
          value={forwardingPhone}
          onChangeText={setForwardingPhone}
          autoCapitalize="none"
          keyboardType="phone-pad"
          placeholder="+15195551234"
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Links</Text>
        <Text style={styles.cardDesc}>
          Booking link is used in missed-call follow ups. Google link powers QR + review requests.
        </Text>

        <Text style={styles.label}>Booking link</Text>
        <TextInput
          value={bookingLink}
          onChangeText={setBookingLink}
          autoCapitalize="none"
          keyboardType="url"
          placeholder="https://calendly.com/yourbiz/book"
          style={styles.input}
        />

        <Text style={styles.label}>Google review link</Text>
        <TextInput
          value={googleReviewLink}
          onChangeText={setGoogleReviewLink}
          autoCapitalize="none"
          keyboardType="url"
          placeholder="https://g.page/r/XXXX/review"
          style={styles.input}
        />
      </View>

      <Pressable
        onPress={onSave}
        disabled={saving}
        style={({ pressed }) => [
          styles.saveButton,
          saving && styles.saveButtonDisabled,
          pressed && !saving && { opacity: 0.9 },
        ]}
      >
        {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
      </Pressable>

      {/* ✅ Big, clear logout section */}
      {AccountFooter}

      <View style={{ height: 18 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 32 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  centerText: { marginTop: 10, color: '#6B7280' },

  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },

  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 10 },
  emptyDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardDesc: { fontSize: 12, color: '#6B7280', marginTop: 4 },

  label: { fontSize: 12, color: '#6B7280', marginTop: 10, marginBottom: 4 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },

  kvLabel: { fontSize: 12, color: '#6B7280' },
  kvValue: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },

  errorText: { marginBottom: 10, color: '#B91C1C', fontSize: 12 },

  primaryButton: {
    marginTop: 14,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },

  saveButton: {
    marginTop: 4,
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveButtonDisabled: { backgroundColor: '#9CA3AF' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

  // ✅ Admin button styles
  adminButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  adminButtonText: { color: '#7C3AED', fontWeight: '800' },

  adminButtonInline: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  adminButtonInlineText: { color: '#7C3AED', fontWeight: '800' },

  // ✅ NEW: Account + Logout (very visible)
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accountIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTitle: { fontSize: 15, fontWeight: '900', color: '#111827' },
  accountDesc: { marginTop: 2, fontSize: 12, color: '#6B7280' },

  logoutBtn: {
    marginTop: 12,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  logoutHint: { marginTop: 10, fontSize: 12, color: '#6B7280' },
});
