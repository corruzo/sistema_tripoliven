import React, { useEffect, useState } from 'react';
import { Activity, Users, ShieldAlert } from 'lucide-react';
import { API_BASE_URL } from './config';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0, systemStatus: 'Cargando...' });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/dashboard/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ zIndex: 1 }}>
      <div className="page-header">
        <h1>Dashboard Corporativo</h1>
        <p>Resumen y analítica del sistema</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={28} />
          </div>
          <div className="stat-details">
            <h3>Total Personal</h3>
            <p>{stats.totalUsers}</p>
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
          <div className="stat-icon red">
            <ShieldAlert size={28} />
          </div>
          <div className="stat-details">
            <h3>Estado Sistema</h3>
            <p style={{ fontSize: '1.25rem' }}>{stats.systemStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
