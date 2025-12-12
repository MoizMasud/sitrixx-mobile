// src/screens/LeadsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useClientApi } from '../api/clientApi';

type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  source?: string | null;
  created_at: string;
};

function CenterState({
  title,
  subtitle,
  onRetry,
  loading,
}: {
  title: string;
  subtitle?: string;
  onRetry?: () => void;
  loading?: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 12 }}>
          {subtitle}
        </Text>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color="#4A00FF" />
      ) : onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          style={{
            marginTop: 6,
            backgroundColor: '#7C3AED',
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export const LeadsScreen: React.FC = () => {
  const { getLeads } = useClientApi();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);

    try {
      const data = await getLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load({ silent: true });
  };

  const handleCallBack = (phone?: string | null) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const renderItem = ({ item }: { item: Lead }) => (
    <View
      style={{
        backgroundColor: '#fff',
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 4 }}>
        {item.name || 'No name'}
      </Text>

      {item.phone ? <Text>📞 {item.phone}</Text> : null}
      {item.email ? <Text>✉️ {item.email}</Text> : null}
      {item.message ? (
        <Text style={{ marginTop: 6, color: '#555' }}>{item.message}</Text>
      ) : null}

      <Text style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
        {new Date(item.created_at).toLocaleString()} · {item.source || 'website_form'}
      </Text>

      {item.phone ? (
        <TouchableOpacity
          onPress={() => handleCallBack(item.phone)}
          style={{
            marginTop: 12,
            alignSelf: 'flex-start',
            backgroundColor: '#4A00FF',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Call Back</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (loading && !refreshing) {
    return <CenterState title="Loading leads…" loading />;
  }

  if (error) {
    return (
      <CenterState
        title="Couldn’t load leads"
        subtitle={error}
        onRetry={() => load()}
      />
    );
  }

  if (!leads.length) {
    return (
      <CenterState
        title="No leads yet"
        subtitle="Once a customer submits your website form or calls in, leads will show up here."
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F4FF' }}>
      <FlatList
        data={leads}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
};
