import React, { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from './config';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Credenciales inválidas.');
      }
    } catch (err) {
      setLoading(false);
      setError('Error al conectar con el servidor.');
    }
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0B0F19', position: 'relative', overflow: 'hidden', fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.15)', filter: 'blur(100px)', top: '10%', left: '10%'
      }}></div>
      <div style={{
        position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
        background: 'rgba(239, 68, 68, 0.1)', filter: 'blur(100px)', bottom: '10%', right: '10%'
      }}></div>

      <div style={{
        background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px',
        padding: '40px', width: '400px', boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
        zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        {/* Logo / Header */}
        <div style={{
          width: '60px', height: '60px', borderRadius: '16px', background: 'var(--accent-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
        }}>
          <Lock size={28} color="white" />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 8px 0', textAlign: 'center' }}>
          OmniDispatch Enterprise
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 32px 0', textAlign: 'center' }}>
          Ingresa tus credenciales para acceder al sistema
        </p>

        {error && (
          <div style={{
            width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '20px', color: '#f87171', fontSize: '0.85rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Nombre de Usuario
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                required
                type="text"
                placeholder="Ingresa tu usuario..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                  color: 'white', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                required
                type="password"
                placeholder="Ingresa tu contraseña..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                  color: 'white', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: 'var(--accent-gradient)', border: 'none', color: 'white',
              padding: '14px', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600', fontFamily: 'inherit', transition: 'transform 0.2s, opacity 0.2s',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
