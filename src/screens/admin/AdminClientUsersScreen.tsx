import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

type AdminUserRow = {
  id: string;
  email: string | null;
  display_name?: string | null;
  phone?: string | null;
  role?: string | null;
  created_at?: string;
  needs_password_change?: boolean | null;
};

export default function AdminClientUsersScreen({ route, navigation }: any) {
  const api = useClientApi();

  // ✅ stabilize API refs (prevents infinite loop)
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const client: ClientInfo | undefined = route.params?.client;

  const title = useMemo(() => client?.business_name || 'Business', [client?.business_name]);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
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

  // ✅ debounce focus refresh
  const focusDebounceRef = useRef<number>(0);

  const buildQuery = () => {
    if (!client?.id) return '';
    return `clientId=${encodeURIComponent(client.id)}`;
  };

  const load = useCallback(async (opts?: { showSpinner?: boolean }) => {
    const showSpinner = opts?.showSpinner ?? true;

    if (!client?.id) {
      setError('Missing business');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (inFlightRef.current) {
      console.log('[AdminUsers] load skipped — already in flight');
      return;
    }

    const run = (async () => {
      console.log('[AdminUsers] load start', { showSpinner, clientId: client.id });

      try {
        if (!mountedRef.current) return;

        setError(null);
        if (showSpinner) setLoading(true);
        else setRefreshing(true);

        const query = buildQuery();
        console.log('[AdminUsers] calling adminUsersApi(GET)', { query });

        const body: any = await apiRef.current.adminClientUsersApi(client.id);

        console.log('[AdminUsers] api response:', body);

        const list = (body?.users || []) as AdminUserRow[];
        console.log('[AdminUsers] parsed users:', list.length);

        if (!mountedRef.current) return;
        setUsers(list);
      } catch (e: any) {
        console.error('[AdminUsers] load error', e);
        if (!mountedRef.current) return;
        setUsers([]);
        setError(e?.message || 'Failed to load users');
      } finally {
        console.log('[AdminUsers] load end');
        inFlightRef.current = null;

        if (!mountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    })();

    inFlightRef.current = run;
    await run;
  }, [client?.id]);

  // initial load once
  useEffect(() => {
    load({ showSpinner: true });
  }, [load]);

  // refresh on focus (debounced)
  useFocusEffect(
    useCallback(() => {
      console.log('[AdminUsers] screen focused');

      const now = Date.now();
      if (now - focusDebounceRef.current < 600) {
        console.log('[AdminUsers] focus refresh skipped (debounced)');
      } else {
        focusDebounceRef.current = now;
        load({ showSpinner: false });
      }

      return () => console.log('[AdminUsers] screen unfocused');
    }, [load]),
  );

  const onAdd = () => {
    if (!client) return;
    navigation.navigate('AdminUserCreate', { client });
  };

  const onEdit = (user: AdminUserRow) => {
    if (!client) return;
    navigation.navigate('AdminUserEdit', { client, user });
  };

  const confirmDelete = (user: AdminUserRow) => {
    Alert.alert(
      'Delete user?',
      'This deletes the user (auth + profile) and unlinks them from this business.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[AdminUsers] delete start', { userId: user.id });

              // ✅ IMPORTANT: adminUsersApi signature is (method, query?, body?)
              const body: any = await apiRef.current.adminUsersApi('DELETE', undefined, {
                userId: user.id,
              });

              if (!body?.ok) throw new Error(body?.error || 'Failed to delete user');

              await load({ showSpinner: false });
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete user');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: AdminUserRow }) => {
    const name = item.display_name?.trim() || '—';
    const email = item.email || '—';
    const needsPw = !!item.needs_password_change;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{email}</Text>
            <Text style={styles.cardSub}>Name: {name}</Text>
            {!!item.phone && <Text style={styles.cardSub}>Phone: {item.phone}</Text>}
          </View>

          <Pressable onPress={() => confirmDelete(item)} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
          </Pressable>
        </View>

        <View style={styles.pillsRow}>
          <View style={[styles.pill, needsPw ? styles.pillWarn : styles.pillOff]}>
            <Text style={[styles.pillText, needsPw ? styles.pillTextWarn : styles.pillTextOff]}>
              {needsPw ? 'Needs password change' : 'Password ok'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => onEdit(item)}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.92 }]}
          >
            <Ionicons name="create-outline" size={16} color="#111827" />
            <Text style={styles.btnText}>Edit</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.centerText}>Loading users…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>{title}</Text>
        </View>

        <Pressable onPress={onAdd} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.92 }]}>
          <Ionicons name="person-add-outline" size={18} color="#fff" />
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
        data={users}
        keyExtractor={(u) => u.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={() => load({ showSpinner: false })}
        contentContainerStyle={{ padding: 16, paddingBottom: 22 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No users yet</Text>
            <Text style={styles.emptyDesc}>Add a user and link them to this business.</Text>
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
  pillWarn: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  pillOff: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  pillText: { fontWeight: '900', fontSize: 12 },
  pillTextWarn: { color: '#92400E' },
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

  empty: { marginTop: 40, alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  emptyDesc: { marginTop: 6, textAlign: 'center', color: '#6B7280' },
  primaryBtn: { marginTop: 14, backgroundColor: '#7C3AED', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999 },
  primaryBtnText: { color: '#fff', fontWeight: '900' },
});
