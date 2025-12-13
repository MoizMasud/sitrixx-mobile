import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useClientApi, ClientInfo } from '../../api/clientApi';

export default function AdminClientEditScreen({ route, navigation }: any) {
  const { adminClientsApi } = useClientApi();
  const mode: 'create' | 'edit' = route.params?.mode || 'create';
  const existing: ClientInfo | null = route.params?.client || null;

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [business_name, setBusinessName] = useState(existing?.business_name || '');
  const [website_url, setWebsiteUrl] = useState(existing?.website_url || '');
  const [booking_link, setBookingLink] = useState(existing?.booking_link || '');
  const [google_review_link, setGoogleReviewLink] = useState(existing?.google_review_link || '');
  const [forwarding_phone, setForwardingPhone] = useState(existing?.forwarding_phone || '');

  // ✅ IMPORTANT: this is the one you said saves but doesn’t load back
  const [twilio_number, setTwilioNumber] = useState(existing?.twilio_number || '');

  const [custom_sms_template, setCustomSmsTemplate] = useState(existing?.custom_sms_template || '');
  const [review_sms_template, setReviewSmsTemplate] = useState(existing?.review_sms_template || '');

  const [auto_review_enabled, setAutoReviewEnabled] = useState<boolean>(
    typeof existing?.auto_review_enabled === 'boolean' ? existing.auto_review_enabled : false,
  );

  const title = useMemo(() => (mode === 'create' ? 'Add Business' : 'Edit Business'), [mode]);

  const save = async () => {
    try {
      const name = business_name.trim();
      if (!name) {
        Alert.alert('Missing', 'Business name is required');
        return;
      }

      setSaving(true);

      const payload = {
        business_name: name,
        website_url: website_url.trim() || null,
        booking_link: booking_link.trim() || null,
        google_review_link: google_review_link.trim() || null,
        forwarding_phone: forwarding_phone.trim() || null,

        // ✅ send Twilio number too
        twilio_number: twilio_number.trim() || null,

        custom_sms_template: custom_sms_template.trim() || null,
        review_sms_template: review_sms_template.trim() || null,
        auto_review_enabled: !!auto_review_enabled,
      };

      if (mode === 'create') {
        console.log('[AdminClientEdit] CREATE payload', payload);
        const body: any = await adminClientsApi('POST', undefined, payload);
        if (!body?.ok) throw new Error(body?.error || 'Failed to create business');
      } else {
        if (!existing?.id) throw new Error('Missing business id');
        const updatePayload = { id: existing.id, ...payload };
        console.log('[AdminClientEdit] UPDATE payload', updatePayload);
        const body: any = await adminClientsApi('PATCH', undefined, updatePayload);
        if (!body?.ok) throw new Error(body?.error || 'Failed to update business');
      }

      navigation.goBack();
    } catch (e: any) {
      console.error('[AdminClientEdit] save error', e);
      Alert.alert('Error', e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing?.id) return;
    Alert.alert(
      'Delete business?',
      'This will delete the business and related records. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ],
    );
  };

  const doDelete = async () => {
    try {
      if (!existing?.id) return;
      setDeleting(true);
      const body: any = await adminClientsApi('DELETE', undefined, { id: existing.id });
      if (!body?.ok) throw new Error(body?.error || 'Failed to delete business');
      Alert.alert('Deleted', 'Business removed.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Keep templates simple and clean—these power automations.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Business name</Text>
        <TextInput value={business_name} onChangeText={setBusinessName} style={styles.input} />

        <Text style={styles.label}>Website URL</Text>
        <TextInput value={website_url} onChangeText={setWebsiteUrl} style={styles.input} autoCapitalize="none" />

        <Text style={styles.label}>Forwarding phone</Text>
        <TextInput value={forwarding_phone} onChangeText={setForwardingPhone} style={styles.input} keyboardType="phone-pad" />

        <Text style={styles.label}>Twilio number</Text>
        <TextInput
          value={twilio_number}
          onChangeText={setTwilioNumber}
          style={styles.input}
          keyboardType="phone-pad"
          placeholder="+15195551234"
        />

        <Text style={styles.label}>Booking link</Text>
        <TextInput value={booking_link} onChangeText={setBookingLink} style={styles.input} autoCapitalize="none" />

        <Text style={styles.label}>Google review link</Text>
        <TextInput value={google_review_link} onChangeText={setGoogleReviewLink} style={styles.input} autoCapitalize="none" />

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Auto reviews</Text>
            <Text style={styles.toggleDesc}>Automatically request reviews after a completed job.</Text>
          </View>
          <Switch value={auto_review_enabled} onValueChange={setAutoReviewEnabled} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Templates</Text>
        <Text style={styles.cardDesc}>Missed call and review request templates.</Text>

        <Text style={styles.label}>Missed-call SMS template</Text>
        <TextInput
          value={custom_sms_template}
          onChangeText={setCustomSmsTemplate}
          multiline
          style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
        />

        <Text style={styles.label}>Review SMS template</Text>
        <TextInput
          value={review_sms_template}
          onChangeText={setReviewSmsTemplate}
          multiline
          style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
        />
      </View>

      <Pressable
        onPress={save}
        disabled={saving || deleting}
        style={({ pressed }) => [
          styles.primaryBtn,
          (saving || deleting) && { backgroundColor: '#9CA3AF' },
          pressed && !(saving || deleting) && { opacity: 0.92 },
        ]}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save</Text>}
      </Pressable>

      {mode === 'edit' && (
        <Pressable
          onPress={confirmDelete}
          disabled={saving || deleting}
          style={({ pressed }) => [
            styles.dangerBtn,
            (saving || deleting) && { opacity: 0.6 },
            pressed && !(saving || deleting) && { opacity: 0.92 },
          ]}
        >
          {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.dangerBtnText}>Delete Business</Text>}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 28, gap: 12 },

  title: { fontSize: 24, fontWeight: '900', color: '#111827' },
  subtitle: { color: '#6B7280' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#111827' },
  cardDesc: { color: '#6B7280', marginTop: 4, marginBottom: 8 },

  label: { fontSize: 12, color: '#6B7280', marginTop: 10, marginBottom: 6, fontWeight: '700' },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },

  toggleRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  toggleTitle: { fontWeight: '900', color: '#111827' },
  toggleDesc: { marginTop: 4, color: '#6B7280', fontSize: 12 },

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

