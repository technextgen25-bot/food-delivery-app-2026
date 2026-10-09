import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import RestaurantsPage from './pages/RestaurantsPage';
import DriversPage from './pages/DriversPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="restaurants" element={<RestaurantsPage />} />
            <Route path="drivers" element={<DriversPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
