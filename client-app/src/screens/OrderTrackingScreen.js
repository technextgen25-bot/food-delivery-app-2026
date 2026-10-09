import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import io from 'socket.io-client';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  PENDING: 'Commande envoyée',
  ACCEPTED: 'Acceptée par le restaurant',
  PREPARING: 'En préparation',
  READY_FOR_PICKUP: 'Prête, en attente du livreur',
  PICKED_UP: 'Récupérée par le livreur',
  ON_THE_WAY: 'En route vers toi',
  DELIVERED: 'Livrée 🎉',
  CANCELLED: 'Annulée',
};

const STATUS_ORDER = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
];

const SOCKET_URL = 'http://localhost:4000';

export default function OrderTrackingScreen({ route }) {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    loadOrder();

    const socket = io(SOCKET_URL);
    socket.emit('join_client_room', user.id);
    socket.on('order_status_update', (update) => {
      if (update.orderId === orderId) {
        setOrder((prev) => (prev ? { ...prev, status: update.status } : prev));
      }
    });

    return () => socket.disconnect();
  }, [orderId]);

  async function loadOrder() {
    const { data } = await apiClient.get(`/orders/${orderId}`);
    setOrder(data);
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Chargement de la commande...</Text>
      </View>
    );
  }

  const currentStepIndex = STATUS_ORDER.indexOf(order.status);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Commande #{order.id.slice(0, 8)}</Text>
      <Text style={styles.restaurantName}>{order.restaurant.name}</Text>

      <View style={styles.timeline}>
        {STATUS_ORDER.map((status, index) => (
          <View key={status} style={styles.timelineRow}>
            <View
              style={[
                styles.dot,
                index <= currentStepIndex && styles.dotActive,
              ]}
            />
            <Text
              style={[
                styles.timelineLabel,
                index <= currentStepIndex && styles.timelineLabelActive,
              ]}
            >
              {STATUS_LABELS[status]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  restaurantName: { fontSize: 15, color: '#777', marginBottom: 24 },
  timeline: { marginTop: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  dotActive: { backgroundColor: '#FF5A1F' },
  timelineLabel: { fontSize: 15, color: '#aaa' },
  timelineLabelActive: { color: '#111', fontWeight: '600' },
});
