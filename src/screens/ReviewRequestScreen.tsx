// src/screens/ReviewRequestScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from 'react-native';
import { useClientApi, ClientInfo } from '../api/clientApi';

const DEFAULT_REVIEW_TEMPLATE =
  `Hi {customerName} — thanks for choosing {businessName}!\n` +
  `Would you mind leaving us a quick Google review?\n` +
  `{reviewLink}`;

const DEFAULT_MISSED_CALL_TEMPLATE =
  `Sorry we missed your call at {businessName}.\n` +
  `Reply to this text and we’ll get back to you shortly.`;

const REVIEW_PLACEHOLDERS = [
  { key: '{customerName}', desc: 'Customer name' },
  { key: '{businessName}', desc: 'Your business name' },
  { key: '{reviewLink}', desc: 'Google review link' },
];

const MISSED_CALL_PLACEHOLDERS = [
  { key: '{businessName}', desc: 'Your business name' },
  { key: '{bookingLink}', desc: 'Booking link (optional)' },
  { key: '{customerName}', desc: 'Customer name (optional)' },
];

function applyTemplate(template: string, client: ClientInfo, previewName = 'John') {
  const businessName = client.business_name || 'our business';
  const reviewLink = client.google_review_link || '(add your Google review link above)';
  const bookingLink = client.booking_link || '(add your booking link in Admin)';

  return template
    .replaceAll('{businessName}', businessName)
    .replaceAll('{reviewLink}', reviewLink)
    .replaceAll('{bookingLink}', bookingLink)
    .replaceAll('{customerName}', previewName);
}

const ReviewRequestScreen: React.FC = () => {
  const api = useClientApi();

  // keep latest api functions without changing load() identity
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

  const [noClient, setNoClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [client, setClient] = useState<ClientInfo | null>(null);

  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [autoReviewEnabled, setAutoReviewEnabled] = useState(false);

  const [reviewTemplate, setReviewTemplate] = useState(DEFAULT_REVIEW_TEMPLATE);
  const [missedCallTemplate, setMissedCallTemplate] = useState(DEFAULT_MISSED_CALL_TEMPLATE);

  const reviewPreviewText = useMemo(() => {
    if (!client) return '';
    return applyTemplate(reviewTemplate, client, 'John');
  }, [reviewTemplate, client]);

  const missedCallPreviewText = useMemo(() => {
    if (!client) return '';
    return applyTemplate(missedCallTemplate, client, 'John');
  }, [missedCallTemplate, client]);

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
      setGoogleReviewLink(info.google_review_link || '');
      setAutoReviewEnabled(!!info.auto_review_enabled);

      setReviewTemplate(info.review_sms_template || DEFAULT_REVIEW_TEMPLATE);
      setMissedCallTemplate(info.custom_sms_template || DEFAULT_MISSED_CALL_TEMPLATE);
    } catch (e: any) {
      if (!isMountedRef.current) return;
      setError(e?.message || 'Failed to load settings');
      setClient(null);
    } finally {
      if (!isMountedRef.current) return;
      setLoading(false);
    }
  }, []);

  // ✅ only load once when the screen mounts (no focus loop)
  useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    if (!client) return;

    const link = googleReviewLink.trim();

    if (autoReviewEnabled && !link) {
      Alert.alert(
        'Add your Google review link',
        'Auto review can’t be enabled without a Google review link.',
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Save all editable client fields in one call
      await apiRef.current.updateClientInfo({
        id: client.id,
        google_review_link: link || null,
        review_sms_template: reviewTemplate,
        custom_sms_template: missedCallTemplate,
      });

      // Save toggle separately (keeps existing backend behavior)
      await apiRef.current.updateClientAutoReview({
        clientId: client.id,
        autoReviewEnabled,
      });

      Alert.alert('Saved', 'Your messaging settings have been updated.');

      // refresh without forcing a “bounce to loading”
      await load({ showSpinner: false });
    } catch (e: any) {
      setError(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // ---------- UI states ----------
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
        <Text style={styles.title}>Messaging</Text>
        <Text style={styles.emptyTitle}>No business found</Text>
        <Text style={styles.emptyDesc}>
          No client found for this account. Ask an admin to link your user to a business.
        </Text>

        <Pressable onPress={() => load()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Messaging</Text>
        <Text style={styles.emptyTitle}>Couldn’t load</Text>
        <Text style={styles.emptyDesc}>{error || 'Unknown error'}</Text>

        <Pressable onPress={() => load()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // ---------- Main screen ----------
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Messaging</Text>
      <Text style={styles.subtitle}>
        Configure your review request + missed call SMS templates.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Auto review toggle */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.cardTitle}>Auto review</Text>
            <Text style={styles.cardDesc}>
              When ON, customers you add in Contacts will automatically receive a review request.
            </Text>
          </View>

          <Switch value={autoReviewEnabled} onValueChange={setAutoReviewEnabled} />
        </View>

        {autoReviewEnabled && !googleReviewLink.trim() ? (
          <Text style={styles.warnText}>
            Auto review is ON, but your Google review link is empty. Add it below before saving.
          </Text>
        ) : null}
      </View>

      {/* Google review link */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Google review link</Text>
        <Text style={styles.cardDesc}>
          Paste the link customers should open to leave a review.
        </Text>

        <Text style={styles.label}>Google review link</Text>
        <TextInput
          value={googleReviewLink}
          onChangeText={setGoogleReviewLink}
          autoCapitalize="none"
          placeholder="https://g.page/r/XXXX/review"
          style={styles.input}
        />
      </View>

      {/* Review request template */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Review request SMS</Text>
        <Text style={styles.cardDesc}>Sent when you manually send a review, or when Auto review is ON.</Text>

        <View style={styles.placeholderRow}>
          {REVIEW_PLACEHOLDERS.map((p) => (
            <View key={p.key} style={styles.placeholderChip}>
              <Text style={styles.placeholderKey}>{p.key}</Text>
              <Text style={styles.placeholderDesc}>{p.desc}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.label}>Template</Text>
        <TextInput
          value={reviewTemplate}
          onChangeText={setReviewTemplate}
          multiline
          style={[styles.input, styles.textarea]}
          placeholder={DEFAULT_REVIEW_TEMPLATE}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Preview</Text>
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>{reviewPreviewText}</Text>
        </View>
      </View>

      {/* Missed call template */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Missed call SMS</Text>
        <Text style={styles.cardDesc}>
          Sent when a customer calls and the business misses it (your missed-call automation).
        </Text>

        <View style={styles.placeholderRow}>
          {MISSED_CALL_PLACEHOLDERS.map((p) => (
            <View key={p.key} style={styles.placeholderChip}>
              <Text style={styles.placeholderKey}>{p.key}</Text>
              <Text style={styles.placeholderDesc}>{p.desc}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.label}>Template</Text>
        <TextInput
          value={missedCallTemplate}
          onChangeText={setMissedCallTemplate}
          multiline
          style={[styles.input, styles.textarea]}
          placeholder={DEFAULT_MISSED_CALL_TEMPLATE}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Preview</Text>
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>{missedCallPreviewText}</Text>
        </View>

        {!client.booking_link ? (
          <Text style={styles.mutedHint}>
            Tip: Add a booking link in Admin if you want to use {'{bookingLink}'}.
          </Text>
        ) : null}
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
    </ScrollView>
  );
};

export default ReviewRequestScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 32 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: '#FFFFFF' },
  centerText: { marginTop: 10, color: '#6B7280' },

  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },

  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 10 },
  emptyDesc: { fontSize: 13, color: '#6B7280', marginTop: 6, textAlign: 'center' },

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
  textarea: { minHeight: 110, textAlignVertical: 'top' },

  previewBox: {
    marginTop: 6,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewText: { color: '#111827', fontSize: 13, lineHeight: 18 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placeholderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 as any, marginTop: 10 },
  placeholderChip: { backgroundColor: '#EEF2FF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  placeholderKey: { fontWeight: '700', color: '#3730A3', fontSize: 12 },
  placeholderDesc: { color: '#4B5563', fontSize: 11, marginTop: 2 },

  warnText: { marginTop: 10, color: '#B45309', fontSize: 12 },
  mutedHint: { marginTop: 10, color: '#6B7280', fontSize: 12 },

  errorText: { marginBottom: 10, color: '#B91C1C', fontSize: 12 },

  primaryButton: { marginTop: 14, backgroundColor: '#7C3AED', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },

  saveButton: { marginTop: 4, backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#9CA3AF' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
