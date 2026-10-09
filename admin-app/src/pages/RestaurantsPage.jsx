import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/restaurants/pending');
      setRestaurants(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    await apiClient.patch(`/admin/restaurants/${id}/approve`);
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <h2 className="page-title">Restaurants en attente d'approbation</h2>

      <div className="card">
        {loading ? (
          <p>Chargement...</p>
        ) : restaurants.length === 0 ? (
          <p style={{ color: '#888' }}>Aucun restaurant en attente pour le moment. ✅</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Ville</th>
                <th>Adresse</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.city}</td>
                  <td>{r.address}</td>
                  <td>
                    <span className="badge badge-pending">En attente</span>
                  </td>
                  <td>
                    <button className="btn" onClick={() => handleApprove(r.id)}>
                      Approuver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
