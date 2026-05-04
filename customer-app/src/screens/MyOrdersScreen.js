import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { api } from '../config/api';

const statusLabel = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const borzoLabel = {
  new: 'New',
  available: 'Available',
  active: 'In transit',
  completed: 'Completed',
  canceled: 'Canceled',
  delayed: 'Delayed',
  reactivated: 'Reactivated',
};

export default function MyOrdersScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    if (phone.trim().length < 6) {
      setError('Enter a valid phone number to check orders.');
      setOrders([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(api.getOrders, { params: { phone: phone.trim() } });
      setOrders(Array.isArray(data) ? data : []);
      if (!data?.length) {
        setError('No orders found for this phone number.');
      }
    } catch (e) {
      setError('Could not fetch orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.orderId}>Order #{item._id?.slice(-6)}</Text>
        <Text style={styles.total}>₹{item.totalAmount}</Text>
      </View>
      <Text style={styles.meta}>Status: {statusLabel[item.status] || item.status}</Text>
      <Text style={styles.meta}>Payment: {item.paymentStatus || 'pending'}</Text>
      <Text style={styles.meta}>Address: {item.customerAddress}</Text>
      <Text style={styles.meta}>
        Items: {(item.items || []).map((i) => `${i.name} x${i.quantity}`).join(', ')}
      </Text>
      {item.deliveryProvider === 'borzo' ? (
        <View style={styles.trackingWrap}>
          <Text style={styles.meta}>Borzo Order ID: {item.borzoOrderId || 'Pending'}</Text>
          <Text style={styles.meta}>
            Borzo: {borzoLabel[item.borzoStatus] || item.borzoStatus || 'Not assigned'}
          </Text>
          {item.borzoTrackingUrl || item.borzoPickupAddress || item.borzoDropAddress ? (
            <View style={styles.trackActions}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('TrackDelivery', {
                    trackingUrl: item.borzoTrackingUrl || null,
                    borzoOrderId: item.borzoOrderId || null,
                    pickupAddress: item.borzoPickupAddress || null,
                    dropAddress: item.borzoDropAddress || item.customerAddress || null,
                  })
                }
              >
                <Text style={styles.trackLink}>Track live delivery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('TrackDelivery', {
                    trackingUrl: item.borzoTrackingUrl || null,
                    borzoOrderId: item.borzoOrderId || null,
                    pickupAddress: item.borzoPickupAddress || null,
                    dropAddress: item.borzoDropAddress || item.customerAddress || null,
                  })
                }
              >
                <Text style={styles.trackMap}>Open map</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.trackPending}>Tracking link will appear soon</Text>
          )}
        </View>
      ) : null}
      {item.deliveryError ? <Text style={styles.deliveryError}>{item.deliveryError}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>Enter your phone number to check your order status.</Text>

        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Phone number"
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.btn} onPress={fetchOrders} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Check Orders</Text>}
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 6, marginBottom: 14 },
  input: {
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1A1A2E',
  },
  btn: {
    marginTop: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { marginTop: 10, color: '#D32F2F', fontWeight: '600' },
  list: { paddingTop: 14, paddingBottom: 30 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { fontWeight: '800', color: '#1A1A2E' },
  total: { fontWeight: '800', color: '#FF6B35' },
  meta: { color: '#555', fontSize: 13, marginTop: 2 },
  trackingWrap: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  trackActions: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 14 },
  trackLink: { marginTop: 5, color: '#FF6B35', fontWeight: '700' },
  trackMap: { marginTop: 5, color: '#2563EB', fontWeight: '700' },
  trackPending: { marginTop: 5, color: '#777', fontSize: 12 },
  deliveryError: { marginTop: 6, color: '#B91C1C', fontSize: 12, fontWeight: '600' },
});
