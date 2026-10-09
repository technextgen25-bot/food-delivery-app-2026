import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function requestOtp(phone) {
    const { data } = await apiClient.post('/auth/request-otp', { phone });
    return data;
  }

  async function verifyOtp(phone, code, fullName) {
    const { data } = await apiClient.post('/auth/verify-otp', {
      phone,
      code,
      fullName,
      role: 'CLIENT',
    });
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  async function logout() {
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, requestOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
