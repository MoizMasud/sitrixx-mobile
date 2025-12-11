// src/screens/ReviewsScreen.tsx
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
import QRCode from 'react-native-qrcode-svg';

type Review = {
  id: string;
  name: string | null;
  rating: number;
  comments: string | null;
  created_at: string;
};

export const ReviewsScreen: React.FC = () => {
  const { getReviews, getClientInfo } = useClientApi();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [googleLink, setGoogleLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const [reviewsData, client] = await Promise.all([
        getReviews(),
        getClientInfo(),
      ]);
      setReviews(reviewsData);
      setGoogleLink(client?.google_review_link || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
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

  const renderItem = ({ item }: { item: Review }) => (
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
        {item.name || 'Anonymous'}
      </Text>

      <Text style={{ color: '#4A00FF', marginBottom: 4 }}>
        {'⭐'.repeat(item.rating)} ({item.rating}/5)
      </Text>

      {item.comments ? (
        <Text style={{ color: '#555' }}>{item.comments}</Text>
      ) : null}

      <Text style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  const renderHeader = () => {
    if (!googleLink) return null;

    return (
      <View
        style={{
          alignItems: 'center',
          paddingVertical: 16,
        }}
      >
        <Text
          style={{
            fontWeight: '600',
            fontSize: 16,
            marginBottom: 8,
            color: '#111',
          }}
        >
          Google Reviews QR
        </Text>
        <QRCode value={googleLink} size={140} />

        <TouchableOpacity
          onPress={() => Linking.openURL(googleLink)}
          style={{ marginTop: 12 }}
        >
          <Text style={{ color: '#4A00FF', textDecorationLine: 'underline' }}>
            Open Google Reviews page
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

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
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
};
