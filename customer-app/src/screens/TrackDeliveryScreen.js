import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

function mapUrl(pickup, drop) {
  if (!pickup || !drop) return null;
  const origin = encodeURIComponent(pickup);
  const destination = encodeURIComponent(drop);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

export default function TrackDeliveryScreen({ route }) {
  const {
    trackingUrl,
    borzoOrderId,
    pickupAddress,
    dropAddress,
  } = route.params || {};
  const [tab, setTab] = useState('live');

  const pickupDropUrl = useMemo(
    () => mapUrl(pickupAddress, dropAddress),
    [pickupAddress, dropAddress]
  );

  const activeUrl = tab === 'live' ? trackingUrl : pickupDropUrl;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Borzo Tracking</Text>
        <Text style={styles.subTitle}>Order ID: {borzoOrderId || 'Pending'}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setTab('live')}
          style={[styles.tabBtn, tab === 'live' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, tab === 'live' && styles.tabTextActive]}>Live Tracking</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('map')}
          style={[styles.tabBtn, tab === 'map' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, tab === 'map' && styles.tabTextActive]}>Pickup & Drop</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addressBlock}>
        <Text style={styles.addressText}>Pickup: {pickupAddress || 'N/A'}</Text>
        <Text style={styles.addressText}>Drop: {dropAddress || 'N/A'}</Text>
      </View>

      {activeUrl ? (
        <WebView source={{ uri: activeUrl }} style={styles.webview} />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Tracking is not ready yet</Text>
          <Text style={styles.emptySubTitle}>
            Please wait a moment. Borzo usually sends the tracking URL shortly after order creation.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  subTitle: { marginTop: 2, color: '#6B7280', fontWeight: '600' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  tabBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabBtnActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  tabText: { color: '#4B5563', fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  addressBlock: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 10,
  },
  addressText: { color: '#4B5563', fontSize: 12, marginBottom: 4 },
  webview: { flex: 1, backgroundColor: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 8 },
  emptySubTitle: { textAlign: 'center', color: '#6B7280', lineHeight: 20 },
});
