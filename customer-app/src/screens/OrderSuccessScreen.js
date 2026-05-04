import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function OrderSuccessScreen({ navigation, route }) {
  const { orderId } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>✅</Text>
        </View>
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>
          Your order has been confirmed and is being prepared.
        </Text>
        {orderId && (
          <View style={styles.orderIdBox}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderId}>{orderId}</Text>
          </View>
        )}
        <View style={styles.steps}>
          {['Order Placed ✓', 'Preparing 🍳', 'Out for Delivery 🛵', 'Delivered 🎉'].map((step, i) => (
            <View key={i} style={[styles.step, i === 0 && styles.activeStep]}>
              <Text style={[styles.stepText, i === 0 && styles.activeStepText]}>{step}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.btnText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E8FFF0', justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 30, fontWeight: '800', color: '#1A1A2E', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  orderIdBox: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    alignItems: 'center', width: '100%', marginBottom: 24,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  orderIdLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  orderId: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', fontFamily: 'monospace' },
  steps: { width: '100%', marginBottom: 30 },
  step: {
    backgroundColor: '#F5F5F5', borderRadius: 12,
    padding: 14, marginBottom: 8,
  },
  activeStep: { backgroundColor: '#FFF0E8', borderWidth: 1.5, borderColor: '#FF6B35' },
  stepText: { fontSize: 14, color: '#999', fontWeight: '600', textAlign: 'center' },
  activeStepText: { color: '#FF6B35' },
  btn: {
    backgroundColor: '#FF6B35', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 40,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
