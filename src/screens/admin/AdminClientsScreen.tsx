import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useClientApi, ClientInfo } from '../../api/clientApi';

export default function AdminClientsScreen({ navigation }: any) {
  const api = useClientApi();

  // ✅ keep API stable (prevents infinite loop caused by new function refs)
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ✅ single-flight control
  const inFlightRef = useRef<Promise<void> | null>(null);

  // ✅ debounce focus refresh (prevents focus/unfocus spam)
  const focusDebounceRef = useRef<number>(0);

  // ✅ if focus refresh gets debounced, schedule a single delayed refresh
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (opts?: { showSpinner?: boolean }) => {
    const showSpinner = opts?.showSpinner ?? true;

    if (inFlightRef.current) {
      console.log('[AdminClients] load skipped — already in flight');
      return;
    }

    const run = (async () => {
      console.log('[AdminClients] load start', { showSpinner });

      try {
        if (!mountedRef.current) return;

        setError(null);

        if (showSpinner) setLoading(true);
        else setRefreshing(true);

        console.log('[AdminClients] calling adminClientsApi(GET)');
        const body: any = await apiRef.current.adminClientsApi('GET');

        console.log('[AdminClients] api response:', body);

        const list = (body?.clients || []) as ClientInfo[];
        console.log('[AdminClients] parsed clients:', list.length);

        if (!mountedRef.current) return;
        setClients(list);
      } catch (e: any) {
        console.error('[AdminClients] load error', e);
        if (!mountedRef.current) return;
        setClients([]);
        setError(e?.message || 'Failed to load businesses');
      } finally {
        console.log('[AdminClients] load end');
        inFlightRef.current = null;

        if (!mountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    })();

    inFlightRef.current = run;
    await run;
  }, []);

  // initial load once
  useEffect(() => {
    load({ showSpinner: true });
  }, [load]);

  // refresh on focus (debounced)
  useFocusEffect(
    useCallback(() => {
      console.log('[AdminClients] screen focused');

      const now = Date.now();

      // clear any old scheduled refresh
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }

      if (now - focusDebounceRef.current < 600) {
        console.log('[AdminClients] focus refresh skipped (debounced) — scheduling delayed refresh');
        // ✅ this fixes “new business doesn’t appear unless I switch tabs”
        focusTimeoutRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          load({ showSpinner: false });
        }, 650);
      } else {
        focusDebounceRef.current = now;
        load({ showSpinner: false });
      }

      return () => {
        console.log('[AdminClients] screen unfocused');
        if (focusTimeoutRef.current) {
          clearTimeout(focusTimeoutRef.current);
          focusTimeoutRef.current = null;
        }
      };
    }, [load]),
  );

  const onAdd = () => navigation.navigate('AdminClientEdit', { mode: 'create' });
  const onEdit = (client: ClientInfo) =>
    navigation.navigate('AdminClientEdit', { mode: 'edit', client });
  const onUsers = (client: ClientInfo) =>
    navigation.navigate('AdminClientUsers', { client });

  const confirmDelete = (client: ClientInfo) => {
    Alert.alert(
      'Delete business?',
      'This deletes the business and related records. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[AdminClients] delete start', { id: client.id });
              const body: any = await apiRef.current.adminClientsApi('DELETE', undefined, {
                id: client.id,
              });

              if (!body?.ok) throw new Error(body?.error || 'Failed to delete business');

              await load({ showSpinner: false });
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete business');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: ClientInfo }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Pressable
          onPress={() => onEdit(item)}
          style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.cardTitle}>{item.business_name}</Text>
          <Text style={styles.cardSub}>{item.website_url || '—'}</Text>
        </Pressable>

        <Pressable onPress={() => confirmDelete(item)} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={20} color="#DC2626" />
        </Pressable>
      </View>

      <View style={styles.pillsRow}>
        <View style={[styles.pill, item.auto_review_enabled ? styles.pillOn : styles.pillOff]}>
          <Text style={[styles.pillText, item.auto_review_enabled ? styles.pillTextOn : styles.pillTextOff]}>
            Auto Reviews: {item.auto_review_enabled ? 'ON' : 'OFF'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={() => onEdit(item)} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.92 }]}>
          <Ionicons name="create-outline" size={16} color="#111827" />
          <Text style={styles.btnText}>Edit</Text>
        </Pressable>

        <Pressable onPress={() => onUsers(item)} style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.92 }]}>
          <Ionicons name="people-outline" size={16} color="#fff" />
          <Text style={styles.btnPrimaryText}>Users</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.centerText}>Loading businesses…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Businesses</Text>
          <Text style={styles.subtitle}>Create and manage client businesses.</Text>
        </View>

        <Pressable onPress={onAdd} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.92 }]}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => load({ showSpinner: true })} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={clients}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={() => load({ showSpinner: false })}
        contentContainerStyle={{ padding: 16, paddingBottom: 22 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No businesses yet</Text>
            <Text style={styles.emptyDesc}>Add your first business to get started.</Text>

            <Pressable onPress={onAdd} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Add business</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  header: {
    padding: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#111827' },
  subtitle: { marginTop: 2, color: '#6B7280' },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addBtnText: { color: '#fff', fontWeight: '900' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  centerText: { marginTop: 10, color: '#6B7280' },

  errorBox: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { color: '#991B1B', fontWeight: '700' },
  retryBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  retryText: { color: '#fff', fontWeight: '900' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
  cardSub: { marginTop: 3, color: '#6B7280' },

  iconBtn: { padding: 6, borderRadius: 10 },

  pillsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  pillOn: { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  pillOff: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  pillText: { fontWeight: '900', fontSize: 12 },
  pillTextOn: { color: '#065F46' },
  pillTextOff: { color: '#6B7280' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnText: { fontWeight: '900', color: '#111827' },

  btnPrimary: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimaryText: { fontWeight: '900', color: '#fff' },

  empty: { marginTop: 40, alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  emptyDesc: { marginTop: 6, textAlign: 'center', color: '#6B7280' },
  primaryBtn: { marginTop: 14, backgroundColor: '#7C3AED', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999 },
  primaryBtnText: { color: '#fff', fontWeight: '900' },
});
