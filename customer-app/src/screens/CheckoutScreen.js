import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { api } from '../config/api';

const DEFAULT_SETTINGS = {
  appName: 'FoodApp',
  logoUrl: '',
  accentColor: '#FF6B35',
};

export default function CheckoutScreen({ navigation }) {
  const { cart, total, dispatch } = useCart();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useFocusEffect(useCallback(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get(api.getSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
  }, []));

  const handlePlaceOrder = async () => {
    if (!form.name || !form.phone || !form.address) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    if (form.phone.trim().length < 6) {
      Alert.alert('Invalid Phone', 'Enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        customerName: form.name,
        customerPhone: form.phone.trim(),
        customerAddress: form.address,
        items: cart.map(i => ({
          menuItemId: i._id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        totalAmount: total,
        paymentStatus: 'paid',
      };

      const { data: order } = await axios.post(api.createOrder, orderPayload);

      dispatch({ type: 'CLEAR_CART' });
      Alert.alert(
        'Order Placed',
        `Your order has been placed successfully.\nOrder ID: ${order._id}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'MyOrders' } }],
              });
            },
          },
        ]
      );

    } catch (error) {
      const apiError = error?.response?.data?.error;
      Alert.alert('Error', apiError || error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>Checkout</Text>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.map(item => (
            <View key={item._id} style={styles.orderRow}>
              <Text style={styles.orderItemName}>{item.name} × {item.quantity}</Text>
              <Text style={styles.orderItemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.orderRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>

        {/* Delivery Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#aaa"
            value={form.name}
            onChangeText={v => setForm({ ...form, name: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={v => setForm({ ...form, phone: v })}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Delivery Address (Bengaluru only)"
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={3}
            value={form.address}
            onChangeText={v => setForm({ ...form, address: v })}
          />
        </View>

        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: settings.accentColor || '#FF6B35' }, loading && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.payBtnText}>Place Order ₹{total}</Text>
              <Text style={styles.paySubText}>Cash on Delivery</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A2E', marginBottom: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    marginBottom: 16, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07,
    shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderItemName: { fontSize: 14, color: '#555' },
  orderItemPrice: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#FF6B35' },
  input: {
    borderWidth: 1.5, borderColor: '#F0F0F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: '#1A1A2E', marginBottom: 12, backgroundColor: '#FAFAFA',
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  payBtn: {
    backgroundColor: '#FF6B35', borderRadius: 18,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
    marginBottom: 30,
  },
  payBtnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  paySubText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
});
