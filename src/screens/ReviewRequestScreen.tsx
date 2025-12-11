// src/screens/ReviewRequestScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Pressable,
  Platform,
} from 'react-native';
import { useClientApi, ClientInfo } from '../api/clientApi';

const DEFAULT_REVIEW_TEMPLATE =
  'Hi {{name}}, thanks for choosing {{business_name}}! ' +
  'It would mean a lot if you could leave us a quick review here: {{review_link}}';

const ReviewRequestScreen: React.FC = () => {
  const { getClientInfo, updateClientAutoReview, updateClientInfo } =
    useClientApi();

  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const clientInfo = await getClientInfo();

      // If there is no template yet, prefill with a sensible *review* template
      if (clientInfo && !clientInfo.custom_sms_template) {
        clientInfo.custom_sms_template = DEFAULT_REVIEW_TEMPLATE;
      }

      setClient(clientInfo);
    } catch (e: any) {
      setError(e?.message || 'Failed to load review settings');
    } finally {
      setLoading(false);
    }
  }, [getClientInfo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateField = <K extends keyof ClientInfo>(
    key: K,
    value: ClientInfo[K],
  ) => {
    if (!client) return;
    setClient({ ...client, [key]: value });
  };

  const handleToggleAutoReview = async (value: boolean) => {
    if (!client) return;

    // optimistic UI
    setClient({ ...client, auto_review_enabled: value });
    try {
      await updateClientAutoReview({ autoReviewEnabled: value });
      setSuccess(`Auto review ${value ? 'enabled' : 'disabled'}`);
    } catch (e: any) {
      setClient({ ...client, auto_review_enabled: !value });
      setError(e?.message || 'Failed to update auto review setting');
    }
  };

  const handleSave = async () => {
    if (!client) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updated = await updateClientInfo({
        id: client.id,
        google_review_link: client.google_review_link,
        twilio_number: client.twilio_number,
        forwarding_phone: client.forwarding_phone,
        custom_sms_template: client.custom_sms_template,
        auto_review_enabled: !!client.auto_review_enabled,
      });

      setClient(updated);
      setSuccess('Settings saved');
    } catch (e: any) {
      setError(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !client) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Loading review settings…</Text>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>No client found for this account.</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable style={styles.primaryButton} onPress={loadData}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Review Requests</Text>
      <Text style={styles.subtitle}>
        This is the message customers receive when you ask them for a review.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      {/* Business info */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Business</Text>
        <Text style={styles.cardValue}>{client.business_name}</Text>

        <Text style={[styles.cardLabel, { marginTop: 8 }]}>Owner email</Text>
        <Text style={styles.cardValue}>{client.owner_email}</Text>
      </View>

      {/* Auto review */}
      <View style={styles.card}>
        <View style={styles.rowSpace}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.cardTitle}>Auto review mode</Text>
            <Text style={styles.cardDescription}>
              When this is ON, new customers you add in the Contacts tab will
              automatically get this review request SMS (as long as a Google
              review link is set).
            </Text>
          </View>
          <Switch
            value={!!client.auto_review_enabled}
            onValueChange={handleToggleAutoReview}
          />
        </View>
      </View>

    {/* Numbers – Twilio is read-only, owner phone is editable */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Numbers</Text>

      {/* Twilio – read-only, managed by Sitrixx */}
      <Text style={styles.inputLabel}>Twilio number (sender)</Text>
      <View style={[styles.input, { backgroundColor: '#F3F4F6' }]}>
        <Text style={{ fontSize: 14, color: '#6B7280' }}>
          {client.twilio_number || 'Configured by Sitrixx support'}
        </Text>
      </View>
      <Text style={styles.cardDescription}>
        This number is managed by Sitrixx so your SMS routing doesn’t break.
      </Text>

      {/* Forwarding phone – owner can edit */}
      <Text style={styles.inputLabel}>Forwarding phone (owner)</Text>
      <TextInput
        style={styles.input}
        placeholder="+1 555 987 6543"
        keyboardType="phone-pad"
        value={client.forwarding_phone || ''}
        onChangeText={(text) => updateField('forwarding_phone', text)}
      />
    </View>


      {/* Google review link */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Google review link</Text>
        <TextInput
          style={styles.input}
          placeholder="https://g.page/r/your-business-review-link"
          autoCapitalize="none"
          autoCorrect={false}
          value={client.google_review_link || ''}
          onChangeText={(text) => updateField('google_review_link', text)}
        />
        <Text style={styles.cardDescription}>
          Customers will be sent here when they tap the review link in your SMS.
        </Text>
      </View>

      {/* Missed called  SMS template */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Missed call SMS template</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          placeholder={DEFAULT_REVIEW_TEMPLATE}
          value={client.custom_sms_template || ''}
          onChangeText={(text) => updateField('custom_sms_template', text)}
        />

        <Text style={[styles.cardDescription, { marginTop: 8 }]}>
          <Text style={{ fontWeight: '600' }}>Available placeholders:</Text>
        </Text>

        <Text style={[styles.cardDescription, { marginTop: 8 }]}>
          <Text style={{ fontWeight: '600' }}>Available placeholders:</Text>
        </Text>

        <Text style={styles.cardDescription}>
          • <Text style={styles.mono}>{'{{name}}'}</Text> – the name of the customer
          who called you (e.g. "John")
        </Text>

        <Text style={styles.cardDescription}>
          • <Text style={styles.mono}>{'{{business_name}}'}</Text> – your business
          name (e.g. "Warhawk Apparel")
        </Text>

        <Text style={styles.cardDescription}>
          • <Text style={styles.mono}>{'{{booking_link}}'}</Text> – your online
          booking / calendar link so the customer can book a time with you
        </Text>

        <Text style={[styles.cardDescription, { marginTop: 6 }]}>
          When the SMS is sent, these placeholders will be replaced with real values.
        </Text>
      </View>

      {/* Google review request SMS template */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Google review SMS template</Text>
        <Text style={styles.cardDescription}>
          This message is sent when you automatically ask customers to leave a Google
          review.
        </Text>

        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          placeholder={
            'Example:\n' +
            'Hi {{name}}, thanks for choosing {{business_name}}! ' +
            'It would mean a lot if you could leave us a quick review here: {{review_link}}'
          }
          value={client.review_sms_template || ''}
          onChangeText={(text) => updateField('review_sms_template', text)}
        />

        <Text style={[styles.cardDescription, { marginTop: 8 }]}>
          <Text style={{ fontWeight: '600' }}>Available placeholders:</Text>
        </Text>
        <Text style={styles.cardDescription}>
          • <Text style={styles.mono}>{'{{name}}'}</Text> – the customer’s name
        </Text>
        <Text style={styles.cardDescription}>
          • <Text style={styles.mono}>{'{{business_name}}'}</Text> – your business
          name
        </Text>
        <Text style={styles.cardDescription}>
          • <Text style={styles.mono}>{'{{review_link}}'}</Text> – your Google review
          link from above
        </Text>
      </View>


      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [
          styles.primaryButton,
          saving && styles.primaryButtonDisabled,
          pressed && !saving && styles.primaryButtonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>
          {saving ? 'Saving…' : 'Save settings'}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

export default ReviewRequestScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#F3F4F6',
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
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
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  cardDescription: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardLabel: { fontSize: 11, color: '#9CA3AF' },
  cardValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
  rowSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  mono: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  errorText: { marginBottom: 8, color: '#B91C1C', fontSize: 12 },
  successText: { marginBottom: 8, color: '#166534', fontSize: 12 },
  primaryButton: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#7C3AED',
  },
  primaryButtonPressed: { opacity: 0.9 },
  primaryButtonDisabled: { backgroundColor: '#9CA3AF' },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  centerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
});
