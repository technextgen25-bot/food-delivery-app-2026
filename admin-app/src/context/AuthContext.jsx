import React, { createContext, useContext, useState } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('admin_user');
    return stored ? JSON.parse(stored) : null;
  });

  async function requestOtp(phone) {
    const { data } = await apiClient.post('/auth/request-otp', { phone });
    return data;
  }

  async function verifyOtp(phone, code) {
    const { data } = await apiClient.post('/auth/verify-otp', { phone, code });

    if (data.user.role !== 'ADMIN') {
      throw new Error("Ce compte n'a pas les droits administrateur");
    }

    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    setAdmin(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ admin, requestOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
