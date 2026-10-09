import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Remplace par l'URL de ton backend (utilise l'IP locale pour tester sur un vrai téléphone)
const BASE_URL = 'http://localhost:4000/api';

const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
