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
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>{title}</Text>
      {subtitle ? <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 12 }}>{subtitle}</Text> : null}

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

export const ReviewsScreen: React.FC = () => {
  const { getReviews, getClientInfo } = useClientApi();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [googleLink, setGoogleLink] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);

    try {
      const [reviewsRes, clientRes] = await Promise.allSettled([getReviews(), getClientInfo()]);

      if (reviewsRes.status === 'fulfilled') {
        const reviewsData = reviewsRes.value;
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } else {
        setError((reviewsRes.reason as any)?.message || 'Failed to fetch reviews');
      }

      if (clientRes.status === 'fulfilled') {
        setGoogleLink(clientRes.value?.google_review_link || null);
      } else {
        setGoogleLink(null);
      }
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
      <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 4 }}>{item.name || 'Anonymous'}</Text>
      <Text style={{ color: '#4A00FF', marginBottom: 4 }}>{'⭐'.repeat(item.rating)} ({item.rating}/5)</Text>
      {item.comments ? <Text style={{ color: '#555' }}>{item.comments}</Text> : null}
      <Text style={{ marginTop: 8, fontSize: 12, color: '#999' }}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <View style={{ alignItems: 'center', paddingVertical: 10 }}>
        <Text style={{ fontWeight: '800', fontSize: 16, marginBottom: 10 }}>Google Reviews QR</Text>

        {googleLink ? (
          <>
            <QRCode value={googleLink} size={140} />
            <TouchableOpacity onPress={() => Linking.openURL(googleLink)} style={{ marginTop: 12 }}>
              <Text style={{ color: '#4A00FF', textDecorationLine: 'underline' }}>Open Google Reviews page</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ color: '#6B7280', textAlign: 'center' }}>
            Add your Google review link in Settings to enable the QR code.
          </Text>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F4FF', justifyContent: 'center' }}>
        <CenterState title="Loading reviews…" loading />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F4FF', justifyContent: 'center' }}>
        <CenterState title="Couldn’t load reviews" subtitle={error} onRetry={() => load()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F4FF' }}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <CenterState
            title="No reviews yet"
            subtitle="When customers leave reviews (or when we sync them), they’ll show up here."
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 18 }}
      />
    </View>
  );
};
