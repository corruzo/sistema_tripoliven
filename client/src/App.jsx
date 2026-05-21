import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AlertCircle, Clock, Hexagon } from 'lucide-react';
import { API_BASE_URL } from './config';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import UsersTable from './UsersTable';
import Departments from './Departments';
import Positions from './Positions';
import Dispatches from './Dispatches';
import DispatchForm from './DispatchForm';
import Reports from './Reports';
import ProductTypes from './ProductTypes';
import Clients from './Clients';
import Login from './Login';
import Legal from './Legal';
import SystemControl from './SystemControl';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  // (Rest of the state and hooks unchanged...)


  // Health check para el servidor (ligero y eficiente)
  const checkServerStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET' });
      if (res.ok) {
        setIsServerOnline(true);
      } else {
        setIsServerOnline(false);
      }
    } catch (err) {
      setIsServerOnline(false);
    }
  };

  // 1. Initial login verification on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('tripoliven_user');
    const lastActive = localStorage.getItem('tripoliven_last_active');
    const loginTime = localStorage.getItem('tripoliven_login_time');
    const now = Date.now();

    if (savedUser && lastActive && loginTime) {
      const elapsedActive = now - Number(lastActive);
      const elapsedAbsolute = now - Number(loginTime);

      // Si ha pasado más de 15 minutos inactivo o más de 12 horas totales
      if (elapsedActive > 15 * 60 * 1000 || elapsedAbsolute > 12 * 60 * 60 * 1000) {
        localStorage.removeItem('tripoliven_user');
        localStorage.removeItem('tripoliven_last_active');
        localStorage.removeItem('tripoliven_login_time');
        setCurrentUser(null);
      } else {
        setCurrentUser(JSON.parse(savedUser));
        localStorage.setItem('tripoliven_last_active', now.toString());
      }
    }
    setLoading(false);

    // Ejecutar primer ping y programar intervalo de revisión cada 15 segundos (optimizado)
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // 2. Activity listeners to update tripoliven_last_active
  useEffect(() => {
    if (!currentUser) return;

    let lastWrite = Date.now();
    const updateActivity = () => {
      const now = Date.now();
      // Throttling: solo escribir en localStorage como máximo cada 4 segundos
      if (now - lastWrite > 4000) {
        localStorage.setItem('tripoliven_last_active', now.toString());
        lastWrite = now;
      }
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [currentUser]);

  // 3. Inactivity and Absolute Timeout Checker Interval
  useEffect(() => {
    if (!currentUser) return;

    const TIMEOUT_INACTIVITY = 15 * 60 * 1000; // 15 minutos
    const TIMEOUT_WARNING = 14 * 60 * 1000;    // 14 minutos (aviso al minuto restante)
    const TIMEOUT_ABSOLUTE = 12 * 60 * 60 * 1000; // 12 horas absoluto

    const checkSession = () => {
      const now = Date.now();
      const lastActive = Number(localStorage.getItem('tripoliven_last_active') || now);
      const loginTime = Number(localStorage.getItem('tripoliven_login_time') || now);

      const elapsedActive = now - lastActive;
      const elapsedAbsolute = now - loginTime;

      // A. Límite absoluto (12 Horas)
      if (elapsedAbsolute > TIMEOUT_ABSOLUTE) {
        performLogout(true);
        alert('Tu sesión ha expirado por límite absoluto de seguridad corporativa (12 horas). Inicia sesión nuevamente.');
        return;
      }

      // B. Expiración de inactividad (15 Minutos)
      if (elapsedActive > TIMEOUT_INACTIVITY) {
        performLogout(true);
        alert('Tu sesión ha expirado por inactividad. Por razones de seguridad, debes iniciar sesión de nuevo.');
        return;
      }

      // C. Mostrar advertencia en el minuto 14
      if (elapsedActive > TIMEOUT_WARNING) {
        const remainingMs = TIMEOUT_INACTIVITY - elapsedActive;
        const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));
        setShowWarningModal(true);
        setCountdown(remainingSecs);
      } else {
        setShowWarningModal(false);
      }
    };

    const sessionTimer = setInterval(checkSession, 1000);
    return () => clearInterval(sessionTimer);
  }, [currentUser]);

  const handleLoginSuccess = (user, token) => {
    const now = Date.now().toString();
    localStorage.setItem('tripoliven_user', JSON.stringify(user));
    localStorage.setItem('tripoliven_token', token);
    localStorage.setItem('tripoliven_login_time', now);
    localStorage.setItem('tripoliven_last_active', now);
    setCurrentUser(user);
    setIsServerOnline(true);
  };

  const performLogout = (force = false) => {
    if (force || window.confirm('¿Seguro que deseas cerrar tu sesión?')) {
      localStorage.removeItem('tripoliven_user');
      localStorage.removeItem('tripoliven_token');
      localStorage.removeItem('tripoliven_last_active');
      localStorage.removeItem('tripoliven_login_time');
      setCurrentUser(null);
      setShowWarningModal(false);
    }
  };

  const handleLogout = () => {
    performLogout(false);
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

      {/* Modal Premium de Advertencia de Expiración de Sesión */}
      {showWarningModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(12px)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '36px',
            width: '420px',
            textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
            color: 'white',
            fontFamily: 'Outfit, sans-serif'
          }}>
            {/* Icono de Alerta con Pulso de Advertencia */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto',
              animation: 'pulse 1.5s infinite'
            }}>
              <Clock size={28} color="#f59e0b" />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 10px 0', color: '#f59e0b' }}>
              Sesión por Expirar
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              Tu sesión se cerrará automáticamente por inactividad para proteger la seguridad de tus datos en 
              <strong style={{ color: 'white', display: 'block', fontSize: '1.6rem', marginTop: '12px', fontFamily: 'monospace' }}>
                {countdown} segundos
              </strong>
            </p>

            {/* Barra de progreso de cuenta regresiva */}
            <div style={{
              width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)',
              borderRadius: '3px', overflow: 'hidden', marginBottom: '28px'
            }}>
              <div style={{
                width: `${(countdown / 60) * 100}%`, height: '100%',
                background: 'var(--accent-gradient)', borderRadius: '3px',
                transition: 'width 1s linear'
              }}></div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => performLogout(true)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                  color: 'white', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.03)'}
              >
                Cerrar Sesión
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('tripoliven_last_active', Date.now().toString());
                  setShowWarningModal(false);
                }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'var(--accent-gradient)', border: 'none',
                  color: 'white', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.target.style.opacity = '0.9'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                Mantener Activa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleek, Premium Window Titlebar (Electron Draggable) */}
      <div className="window-titlebar">
        <div className="window-titlebar-logo">
          <Hexagon size={13} className="titlebar-logo-icon" />
          <span>TripoliERP — Control de Logística y Despachos Tripoliven</span>
        </div>
        <div className="window-titlebar-status">
          <span className="window-titlebar-dot"></span>
          <span>By Vive flow dev</span>
        </div>
      </div>

      <div className="app-layout">
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
            <Route path="/product-types" element={<ProductTypes />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/settings" element={<SystemControl />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
