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
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F4F4FF',
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
        {title}
      </Text>
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

export const ReviewsScreen: React.FC = () => {
  const { getReviews, getClientInfo } = useClientApi();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [googleLink, setGoogleLink] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [clientInfoWarning, setClientInfoWarning] = useState<string | null>(null);

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);

    setError(null);
    setClientInfoWarning(null);

    // 1) Reviews: treat as primary data
    try {
      const reviewsData = await getReviews();
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch reviews');
      setReviews([]);
    }

    // 2) Client info (google link): OPTIONAL — don’t fail the whole screen if missing
    try {
      const client = await getClientInfo();
      setGoogleLink(client?.google_review_link || null);
    } catch (err: any) {
      setGoogleLink(null);
      setClientInfoWarning(err?.message || 'Client info not found.');
    }

    setLoading(false);
    setRefreshing(false);
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
      <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 4 }}>
        {item.name || 'Anonymous'}
      </Text>

      <Text style={{ color: '#4A00FF', marginBottom: 4 }}>
        {'⭐'.repeat(item.rating)} ({item.rating}/5)
      </Text>

      {item.comments ? <Text style={{ color: '#555' }}>{item.comments}</Text> : null}

      <Text style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  const renderHeader = () => {
    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        {/* Optional warning if client info couldn't load */}
        {clientInfoWarning ? (
          <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 8 }}>
            {clientInfoWarning}
          </Text>
        ) : null}

        {/* ✅ Always show QR section */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 14,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
            marginBottom: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontWeight: '800', fontSize: 16, marginBottom: 6 }}>
            Google Reviews QR
          </Text>

          {googleLink ? (
            <>
              <QRCode value={googleLink} size={160} />

              <TouchableOpacity
                onPress={() => Linking.openURL(googleLink)}
                style={{ marginTop: 12 }}
              >
                <Text style={{ color: '#4A00FF', textDecorationLine: 'underline' }}>
                  Open Google Reviews page
                </Text>
              </TouchableOpacity>

              <Text style={{ marginTop: 8, fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
                Put this QR on your counter, invoices, or job completion card to get more reviews.
              </Text>
            </>
          ) : (
            <>
              <View
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#F9FAFB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 10,
                }}
              >
                <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center' }}>
                  Add your Google review link in “Review Requests” to generate a QR code.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Reviews section title + empty hint */}
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontWeight: '800', fontSize: 16 }}>Recent reviews</Text>
          {reviews.length === 0 ? (
            <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 12 }}>
              No reviews yet. Share your QR code to get your first one.
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return <CenterState title="Loading reviews…" loading />;
  }

  if (error) {
    // Still keep your existing behavior: if reviews API fails, show error screen.
    // QR could theoretically still show, but you said "reviews page" should show QR always —
    // if you want QR even on error, tell me and I’ll adjust.
    return (
      <CenterState title="Couldn’t load reviews" subtitle={error} onRetry={() => load()} />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F4FF' }}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 18 }}
        // optional: keeps layout nice when empty (still shows header)
        ListEmptyComponent={<View style={{ height: 8 }} />}
      />
    </View>
  );
};
