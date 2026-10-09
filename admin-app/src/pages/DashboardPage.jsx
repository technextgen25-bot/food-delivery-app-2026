import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Impossible de charger les statistiques'));
  }, []);

  if (error) return <p style={{ color: '#e64f19' }}>{error}</p>;
  if (!stats) return <p>Chargement...</p>;

  const cards = [
    { label: 'Commandes totales', value: stats.totalOrders },
    { label: 'Revenu commissions (DA)', value: stats.totalCommissionRevenue.toLocaleString() },
    { label: 'Restaurants actifs', value: stats.totalRestaurants },
    { label: 'Livreurs actifs', value: stats.totalDrivers },
    { label: 'Clients inscrits', value: stats.totalClients },
  ];

  return (
    <div>
      <h2 className="page-title">Tableau de bord</h2>
      <div className="stats-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="label">{card.label}</div>
            <div className="value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <p style={{ color: '#888', fontSize: 14 }}>
          💡 Ce tableau de bord se met à jour à chaque rechargement de page. Une future
          amélioration pourra y ajouter des graphiques d'évolution (Recharts est déjà
          installé dans le projet) et un rafraîchissement automatique via Socket.io.
        </p>
      </div>
    </div>
  );
}
