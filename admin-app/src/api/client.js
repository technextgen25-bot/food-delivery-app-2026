import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api';

const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
