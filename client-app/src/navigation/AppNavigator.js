import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import HomeScreen from '../screens/HomeScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Restaurants' }} />
      <Stack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Panier' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Paiement' }} />
      <Stack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: 'Suivi de commande', headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF5A1F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
