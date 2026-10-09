import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import apiClient from '../api/client';

export default function HomeScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadRestaurants = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/restaurants', { params: { search } });
      setRestaurants(data);
    } catch (error) {
      console.log('Erreur de chargement des restaurants', error.message);
    }
  }, [search]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadRestaurants();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Que veux-tu manger ? 🍔</Text>

      <TextInput
        style={styles.search}
        placeholder="Rechercher un restaurant..."
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={loadRestaurants}
      />

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item.id })}
          >
            <Image
              source={{ uri: item.bannerUrl || 'https://via.placeholder.com/300x150' }}
              style={styles.banner}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>⭐ {item.rating.toFixed(1)} · {item.city}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun restaurant trouvé pour le moment.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  search: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
  },
  banner: { width: '100%', height: 140 },
  cardInfo: { padding: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, color: '#777', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});
