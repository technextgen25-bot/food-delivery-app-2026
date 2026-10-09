import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }) {
  const { items, addItem, decreaseItem, subtotal, restaurantId } = useCart();

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Ton panier est vide 🛒</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.menuItemId}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity onPress={() => decreaseItem(item.menuItemId)} style={styles.qtyButton}>
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => addItem(item, restaurantId)}
                style={styles.qtyButton}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.itemPrice}>{item.price * item.quantity} DA</Text>
          </View>
        )}
      />

      <View style={styles.summary}>
        <Text style={styles.subtotalText}>Sous-total : {subtotal} DA</Text>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.checkoutButtonText}>Passer la commande</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#999' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: { flex: 1, fontSize: 16 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: { fontSize: 16, fontWeight: '700' },
  qty: { marginHorizontal: 10, fontSize: 16 },
  itemPrice: { fontSize: 16, fontWeight: '600', width: 80, textAlign: 'right' },
  summary: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 16 },
  subtotalText: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  checkoutButton: { backgroundColor: '#FF5A1F', padding: 16, borderRadius: 12, alignItems: 'center' },
  checkoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
