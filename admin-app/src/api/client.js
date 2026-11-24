import axios from 'axios';

// L'URL de l'API peut être surchargée par la variable VITE_API_URL (utile pour un autre environnement).
const BASE_URL = import.meta.env.VITE_API_URL || 'https://food-delivery-app-2026.onrender.com/api';

const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Session expirée : on déconnecte et on revient à la page de connexion
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
