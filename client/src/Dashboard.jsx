import React, { useEffect, useState } from 'react';
import { Activity, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from './config';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0, systemStatus: 'Cargando...' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activeFetch = true;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/dashboard/stats`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`El servidor respondió con código ${res.status}: Fallo interno.`);
        }
        return res.json();
      })
      .then(data => {
        if (activeFetch) {
          setStats(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch(err => {
        if (activeFetch) {
          console.error('Error al cargar estadísticas del Dashboard:', err);
          setError('No se pudieron obtener las estadísticas en tiempo real del servidor. Verifique si TripoliERP Server está activo.');
          setStats({
            totalUsers: '—',
            activeUsers: '—',
            inactiveUsers: '—',
            systemStatus: 'Desconectado'
          });
          setLoading(false);
        }
      });

    return () => {
      activeFetch = false;
    };
  }, []);

  return (
    <div style={{ zIndex: 1 }}>
      <div className="page-header">
        <h1>Dashboard Corporativo</h1>
        <p>Resumen y analítica del sistema</p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '16px',
          padding: '16px 24px',
          marginBottom: '24px',
          color: '#fca5a5',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.05)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <ShieldAlert size={22} style={{ color: '#f87171', flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#ef4444', fontWeight: 600 }}>Alerta de Conexión:</strong> {error}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={28} />
          </div>
          <div className="stat-details">
            <h3>Total Personal</h3>
            <p style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              {stats.totalUsers}
              {!loading && !error && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>registrados</span>}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Activity size={28} />
          </div>
          <div className="stat-details">
            <h3>Cuentas Activas</h3>
            <p>{stats.activeUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red" style={{
            background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: error ? '#ef4444' : '#10b981'
          }}>
            {error ? <ShieldAlert size={28} /> : <CheckCircle2 size={28} />}
          </div>
          <div className="stat-details">
            <h3>Estado Sistema</h3>
            <p style={{ 
              fontSize: '1.25rem', 
              color: error ? '#f87171' : '#34d399',
              fontWeight: '600'
            }}>
              {stats.systemStatus}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
