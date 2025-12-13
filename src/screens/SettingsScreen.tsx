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
    // With your new App.tsx:
    // Root Stack: Main -> AuthedNavigator
    // AuthedNavigator: Tabs + Admin
    navigation.navigate('Main', { screen: 'Admin' });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.centerText}>Loading settings…</Text>
      </View>
    );
  }

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

        {/* ✅ Admin entry still useful even if no client */}
        {profile?.role === 'admin' ? (
          <Pressable onPress={goAdmin} style={styles.adminButton}>
            <Text style={styles.adminButtonText}>Open Admin Panel</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={signOut} style={styles.linkButton}>
          <Text style={styles.linkText}>Logout</Text>
        </Pressable>
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

        <Pressable onPress={signOut} style={styles.linkButton}>
          <Text style={styles.linkText}>Logout</Text>
        </Pressable>
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
            style={({ pressed }) => [
              styles.adminButtonInline,
              pressed && { opacity: 0.9 },
            ]}
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
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </Pressable>

      <Pressable onPress={signOut} style={styles.linkButton}>
        <Text style={styles.linkText}>Logout</Text>
      </Pressable>
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
  },
  saveButtonDisabled: { backgroundColor: '#9CA3AF' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

  linkButton: { marginTop: 14, alignItems: 'center' },
  linkText: { color: '#6B7280', textDecorationLine: 'underline' },

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
});

