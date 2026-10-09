import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import apiClient from '../api/client';
import { useCart } from '../context/CartContext';

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState(null);
  const { addItem, items, subtotal } = useCart();

  useEffect(() => {
    apiClient.get(`/restaurants/${restaurantId}`).then(({ data }) => setRestaurant(data));
  }, [restaurantId]);

  if (!restaurant) {
    return (
      <View style={styles.center}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: restaurant.bannerUrl || 'https://via.placeholder.com/400x180' }}
        style={styles.banner}
      />
      <Text style={styles.title}>{restaurant.name}</Text>
      <Text style={styles.description}>{restaurant.description}</Text>

      <FlatList
        data={restaurant.menuItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.menuItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemPrice}>{item.price} DA</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                addItem(
                  { menuItemId: item.id, name: item.name, price: item.price },
                  restaurantId
                )
              }
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {items.length > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartBarText}>
            Voir le panier ({items.length}) · {subtotal} DA
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { width: '100%', height: 180 },
  title: { fontSize: 24, fontWeight: '700', margin: 16, marginBottom: 4 },
  description: { fontSize: 14, color: '#777', marginHorizontal: 16, marginBottom: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemName: { fontSize: 16, fontWeight: '600' },
  menuItemPrice: { fontSize: 14, color: '#777', marginTop: 2 },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF5A1F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  cartBar: {
    backgroundColor: '#FF5A1F',
    padding: 16,
    alignItems: 'center',
  },
  cartBarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
