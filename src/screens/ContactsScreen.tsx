// src/screens/ContactsScreen.tsx
import React, { useEffect, useState } from 'react';
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
import { useClientApi, CustomerContact } from '../api/clientApi';

const ContactsScreen: React.FC = () => {
  const {
    getCustomers,
    createCustomer,
    sendReviewRequest,
    updateCustomer,
    deleteCustomer,
  } = useClientApi();

  const [customers, setCustomers] = useState<CustomerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New contact form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const list = await getCustomers();
        if (!cancelled) {
          setCustomers(list || []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load contacts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCustomers();

    return () => {
      cancelled = true;
    };
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!phone.trim()) {
      setError('Phone is required');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const customer = await createCustomer({
        name: name.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
      });

      setCustomers((prev) => [customer, ...prev]);
      setName('');
      setPhone('');
      setEmail('');
      setSuccess('Customer added');
    } catch (e: any) {
      setError(e?.message || 'Failed to add customer');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (c: CustomerContact) => {
    setEditingId(c.id);
    setEditName(c.name || '');
    setEditPhone(c.phone || '');
    setEditEmail(c.email || '');
    setError(null);
    setSuccess(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPhone('');
    setEditEmail('');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editPhone.trim()) {
      setError('Phone is required');
      return;
    }

    try {
      setSavingEditId(editingId);
      setError(null);
      setSuccess(null);

      const updated = await updateCustomer({
        id: editingId,
        name: editName.trim() || undefined,
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
      });

      setCustomers((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );

      cancelEdit();
      setSuccess('Contact updated');
    } catch (e: any) {
      setError(e?.message || 'Failed to update contact');
    } finally {
      setSavingEditId(null);
    }
  };

  const confirmDelete = (c: CustomerContact) => {
    Alert.alert(
      'Delete contact',
      `Are you sure you want to delete ${c.name || 'this contact'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(c),
        },
      ],
    );
  };

  const handleDelete = async (c: CustomerContact) => {
    try {
      setDeletingId(c.id);
      setError(null);
      setSuccess(null);

      await deleteCustomer({ id: c.id });

      setCustomers((prev) => prev.filter((x) => x.id !== c.id));
      if (editingId === c.id) {
        cancelEdit();
      }
      setSuccess('Contact deleted');
    } catch (e: any) {
      setError(e?.message || 'Failed to delete contact');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendReview = async (c: CustomerContact) => {
    if (!c.phone) {
      Alert.alert('Missing phone', 'This contact does not have a phone number.');
      return;
    }
    const displayName = c.name || 'there';

    try {
      setSendingId(c.id);
      setError(null);
      setSuccess(null);

      await sendReviewRequest({
        customerName: displayName,
        customerPhone: c.phone,
      });

      setSuccess(`Review request sent to ${displayName}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to send review request');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Contacts</Text>
      <Text style={styles.subtitle}>
        These are the customers saved for this business. Add, edit or remove
        contacts and send review requests manually.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      {loading && customers.length === 0 && (
        <View style={styles.inlineLoader}>
          <ActivityIndicator />
          <Text style={styles.inlineLoaderText}>Loading contacts…</Text>
        </View>
      )}

      {/* Add contact */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add customer</Text>
        <Text style={styles.cardDescription}>
          After you finish a job or call, add the customer here. If auto review
          is ON, they’ll automatically receive your review request SMS.
        </Text>

        <Text style={styles.inputLabel}>Name (optional)</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Customer name"
        />

        <Text style={styles.inputLabel}>Phone *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="10-digit mobile (e.g. 2896819206)"
        />

        <Text style={styles.inputLabel}>Email (optional)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="email@example.com"
        />

        <Pressable
          onPress={handleCreate}
          disabled={creating}
          style={({ pressed }) => [
            styles.primaryButton,
            creating && styles.primaryButtonDisabled,
            pressed && !creating && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {creating ? 'Adding…' : 'Add customer'}
          </Text>
        </Pressable>
      </View>

      {/* Contacts list */}
      <View style={styles.card}>
        <View style={styles.rowSpace}>
          <Text style={styles.cardTitle}>Saved contacts</Text>
          <Text style={styles.badge}>{customers.length}</Text>
        </View>
        <Text style={styles.cardDescription}>
          Tap "Send review" to send your current Google review SMS template to a
          customer, or edit/delete as needed.
        </Text>

        {customers.length === 0 && !loading ? (
          <Text style={styles.mutedText}>No contacts yet.</Text>
        ) : (
          customers.map((c) => {
            const isEditing = editingId === c.id;
            const isSavingEdit = savingEditId === c.id;
            const isDeleting = deletingId === c.id;
            const isSending = sendingId === c.id;

            if (isEditing) {
              return (
                <View key={c.id} style={styles.contactRowEditing}>
                  <Text style={styles.editLabel}>Editing contact</Text>

                  <Text style={styles.inputLabel}>Name (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Customer name"
                  />

                  <Text style={styles.inputLabel}>Phone *</Text>
                  <TextInput
                    style={styles.input}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    keyboardType="phone-pad"
                    placeholder="10-digit mobile"
                  />

                  <Text style={styles.inputLabel}>Email (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="email@example.com"
                  />

                  <View style={styles.editActionsRow}>
                    <Pressable
                      onPress={handleSaveEdit}
                      disabled={isSavingEdit}
                      style={({ pressed }) => [
                        styles.smallPrimaryButton,
                        isSavingEdit && styles.smallPrimaryButtonDisabled,
                        pressed &&
                          !isSavingEdit &&
                          styles.smallPrimaryButtonPressed,
                      ]}
                    >
                      <Text style={styles.smallPrimaryButtonText}>
                        {isSavingEdit ? 'Saving…' : 'Save'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={cancelEdit}
                      style={({ pressed }) => [
                        styles.smallSecondaryButton,
                        pressed && styles.smallSecondaryButtonPressed,
                      ]}
                    >
                      <Text style={styles.smallSecondaryButtonText}>
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            }

            return (
              <View key={c.id} style={styles.contactRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>
                    {c.name || 'Unnamed contact'}
                  </Text>
                  <Text style={styles.contactPhone}>
                    {c.phone || 'No phone'}
                  </Text>
                  {c.email ? (
                    <Text style={styles.contactEmail}>{c.email}</Text>
                  ) : null}
                </View>

                <View style={styles.contactActionsColumn}>
                  {/* Primary action: Send review */}
                  <Pressable
                    onPress={() => handleSendReview(c)}
                    disabled={isSending}
                    style={({ pressed }) => [
                      styles.smallPrimaryButton,
                      isSending && styles.smallPrimaryButtonDisabled,
                      pressed &&
                        !isSending &&
                        styles.smallPrimaryButtonPressed,
                    ]}
                  >
                    <Text style={styles.smallPrimaryButtonText}>
                      {isSending ? 'Sending…' : 'Send review'}
                    </Text>
                  </Pressable>

                  {/* Secondary actions: Edit + Delete */}
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => startEdit(c)}
                      disabled={isDeleting}
                      style={({ pressed }) => [
                        styles.smallSecondaryButton,
                        pressed && styles.smallSecondaryButtonPressed,
                      ]}
                    >
                      <Text style={styles.smallSecondaryButtonText}>
                        Edit
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDelete(c)}
                      disabled={isDeleting}
                      style={({ pressed }) => [
                        styles.smallDangerButton,
                        pressed && styles.smallDangerButtonPressed,
                      ]}
                    >
                      <Text style={styles.smallDangerButtonText}>
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

export default ContactsScreen;

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
  rowSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
  },
  mutedText: { marginTop: 8, fontSize: 12, color: '#9CA3AF' },

  // Contact rows
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  contactRowEditing: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  contactName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  contactPhone: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  contactEmail: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  contactActionsColumn: {
    marginLeft: 10,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },

  // Main buttons
  primaryButton: {
    marginTop: 12,
    borderRadius: 999,
    paddingVertical: 10,
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

  // Small pill buttons
  smallPrimaryButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4F46E5',
  },
  smallPrimaryButtonPressed: { opacity: 0.9 },
  smallPrimaryButtonDisabled: { backgroundColor: '#9CA3AF' },
  smallPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  smallSecondaryButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  smallSecondaryButtonPressed: { opacity: 0.9 },
  smallSecondaryButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },

  smallDangerButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  smallDangerButtonPressed: { opacity: 0.9 },
  smallDangerButtonText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '500',
  },

  editLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  editActionsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },

  errorText: { marginBottom: 8, color: '#B91C1C', fontSize: 12 },
  successText: { marginBottom: 8, color: '#166534', fontSize: 12 },
  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    columnGap: 8,
  },
  inlineLoaderText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
