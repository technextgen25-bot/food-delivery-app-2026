import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/drivers/pending');
      setDrivers(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    await apiClient.patch(`/admin/drivers/${id}/approve`);
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div>
      <h2 className="page-title">Livreurs en attente d'approbation</h2>

      <div className="card">
        {loading ? (
          <p>Chargement...</p>
        ) : drivers.length === 0 ? (
          <p style={{ color: '#888' }}>Aucun livreur en attente pour le moment. ✅</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Véhicule</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td>{d.user?.fullName || '—'}</td>
                  <td>{d.user?.phone}</td>
                  <td>{d.vehicleType || '—'}</td>
                  <td>
                    <span className="badge badge-pending">En attente</span>
                  </td>
                  <td>
                    <button className="btn" onClick={() => handleApprove(d.id)}>
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
