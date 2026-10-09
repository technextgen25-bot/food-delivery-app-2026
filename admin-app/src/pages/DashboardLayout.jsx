import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1>🍔 FoodDelivery</h1>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            📊 Tableau de bord
          </NavLink>
          <NavLink to="/restaurants" className={({ isActive }) => (isActive ? 'active' : '')}>
            🏪 Restaurants
          </NavLink>
          <NavLink to="/drivers" className={({ isActive }) => (isActive ? 'active' : '')}>
            🛵 Livreurs
          </NavLink>
        </nav>

        <div style={{ marginTop: 40, borderTop: '1px solid #2a2e42', paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: '#888' }}>{admin?.phone}</p>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%' }}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
