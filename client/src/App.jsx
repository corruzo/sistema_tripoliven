import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { API_BASE_URL } from './config';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import UsersTable from './UsersTable';
import Departments from './Departments';
import Positions from './Positions';
import Dispatches from './Dispatches';
import DispatchForm from './DispatchForm';
import DispatchAnalytics from './DispatchAnalytics';
import ProductTypes from './ProductTypes';
import Clients from './Clients';
import Login from './Login';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isServerOnline, setIsServerOnline] = useState(true);

  // Health check para el servidor
  const checkServerStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`, { method: 'GET' });
      if (res.ok) {
        setIsServerOnline(true);
      } else {
        setIsServerOnline(false);
      }
    } catch (err) {
      setIsServerOnline(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('tripoliven_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);

    // Ejecutar primer ping y programar intervalo de revisión cada 6 segundos
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user) => {
    localStorage.setItem('tripoliven_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsServerOnline(true);
  };

  const handleLogout = () => {
    if (window.confirm('¿Seguro que deseas cerrar tu sesión?')) {
      localStorage.removeItem('tripoliven_user');
      setCurrentUser(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0B0F19', color: 'white', fontFamily: 'Outfit, sans-serif'
      }}>
        Cargando sistema...
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* Banner de Servidor Desconectado (Blindaje UX Premium) */}
      {!isServerOnline && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', background: 'rgba(239, 68, 68, 0.95)',
          color: 'white', padding: '12px 20px', borderRadius: '14px', backdropFilter: 'blur(10px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem',
          border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 32px rgba(239, 68, 68, 0.45)',
          fontWeight: '500', transition: 'all 0.3s ease-in-out', animation: 'pulse 2s infinite'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>Servidor desconectado. Intentando reconectar...</span>
        </div>
      )}

      <Sidebar />
      <div className="main-content">
        <div className="bg-glow"></div>
        <Header user={currentUser} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/users" element={<UsersTable />} />
          <Route path="/dispatches" element={<Dispatches />} />
          <Route path="/dispatches/new" element={<DispatchForm />} />
          <Route path="/dispatches/edit/:id" element={<DispatchForm />} />
          <Route path="/dispatches/analytics" element={<DispatchAnalytics />} />
          <Route path="/product-types" element={<ProductTypes />} />
          <Route path="/clients" element={<Clients />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
