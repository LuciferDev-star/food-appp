import React from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, SafeAreaView
} from 'react-native';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }) {
  const { cart, total, dispatch } = useCart();

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add some delicious items from the menu</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.browseBtnText}>Browse Menu</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>
      <FlatList
        data={cart}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImg} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price} each</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => dispatch({ type: 'REMOVE_ITEM', id: item._id })}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => dispatch({ type: 'ADD_ITEM', item })}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtotal}>₹{item.price * item.quantity}</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{total}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, { color: '#22C55E' }]}>FREE</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>
          </View>
        }
      />
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F0' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  emptySubtitle: { fontSize: 14, color: '#888', marginTop: 8, marginBottom: 24 },
  browseBtn: { backgroundColor: '#FF6B35', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 14 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A2E', paddingHorizontal: 20, paddingVertical: 16 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    marginBottom: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
    shadowRadius: 6, elevation: 2,
  },
  itemImg: { width: 56, height: 56, borderRadius: 10, resizeMode: 'cover' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  itemPrice: { fontSize: 12, color: '#888', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  qtyBtn: { backgroundColor: '#FFF0E8', width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 16, color: '#FF6B35', fontWeight: '700' },
  qty: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', paddingHorizontal: 10 },
  subtotal: { fontSize: 15, fontWeight: '800', color: '#FF6B35', minWidth: 50, textAlign: 'right' },
  summary: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 15, color: '#666' },
  summaryValue: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  totalRow: { borderTopWidth: 1, borderColor: '#F0F0F0', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#FF6B35' },
  footer: { padding: 20 },
  checkoutBtn: {
    backgroundColor: '#FF6B35', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35,
    shadowRadius: 10, elevation: 6,
  },
  checkoutText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
