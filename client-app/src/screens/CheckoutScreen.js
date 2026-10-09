import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import apiClient from '../api/client';
import { useCart } from '../context/CartContext';

const PAYMENT_METHODS = [
  { key: 'CARD', label: '💳 Carte bancaire' },
  { key: 'CASH', label: '💵 Paiement à la livraison' },
  { key: 'MOBILE_WALLET', label: '📱 Portefeuille mobile' },
];

export default function CheckoutScreen({ navigation }) {
  const { items, restaurantId, subtotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);

  async function handlePlaceOrder() {
    setLoading(true);
    try {
      // Note : addressId est simplifié ici. En production, prévoir un écran
      // de sélection/ajout d'adresse de livraison avant cette étape.
      const { data } = await apiClient.post('/orders', {
        restaurantId,
        addressId: 'DEFAULT_ADDRESS_ID',
        paymentMethod,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      });

      clearCart();
      navigation.replace('OrderTracking', { orderId: data.id });
    } catch (error) {
      Alert.alert('Erreur', "Impossible de passer la commande. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mode de paiement</Text>

      {PAYMENT_METHODS.map((method) => (
        <TouchableOpacity
          key={method.key}
          style={[
            styles.paymentOption,
            paymentMethod === method.key && styles.paymentOptionSelected,
          ]}
          onPress={() => setPaymentMethod(method.key)}
        >
          <Text style={styles.paymentLabel}>{method.label}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Total à payer : {subtotal + 250} DA</Text>
      </View>

      <TouchableOpacity style={styles.confirmButton} onPress={handlePlaceOrder} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmer la commande</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  paymentOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentOptionSelected: { borderColor: '#FF5A1F', backgroundColor: '#FFF3EC' },
  paymentLabel: { fontSize: 16 },
  summary: { marginTop: 20, marginBottom: 20 },
  summaryText: { fontSize: 18, fontWeight: '700' },
  confirmButton: { backgroundColor: '#FF5A1F', padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
