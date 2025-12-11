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

export const LeadsScreen: React.FC = () => {
  const { getLeads } = useClientApi();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
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
        {new Date(item.created_at).toLocaleString()} ·{' '}
        {item.source || 'website_form'}
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
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator size="large" color="#4A00FF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F4FF' }}>
      {error ? (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 12 }}>
          {error}
        </Text>
      ) : null}

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

