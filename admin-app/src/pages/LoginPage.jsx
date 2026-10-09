import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  async function handleSendCode(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestOtp(phone);
      setStep('code');
    } catch (err) {
      setError("Impossible d'envoyer le code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(phone, code);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>🍔 Back-office Admin</h2>

        {step === 'phone' ? (
          <form onSubmit={handleSendCode}>
            <input
              type="tel"
              placeholder="Numéro de téléphone administrateur"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Envoi...' : 'Recevoir le code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <input
              type="text"
              placeholder="Code à 6 chiffres"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Vérification...' : 'Se connecter'}
            </button>
          </form>
        )}

        {error && <p style={{ color: '#e64f19', marginTop: 12 }}>{error}</p>}

        <p style={{ fontSize: 12, color: '#999', marginTop: 20 }}>
          Seuls les comptes avec le rôle ADMIN (défini directement en base de données)
          peuvent accéder au back-office.
        </p>
      </div>
    </div>
  );
}
