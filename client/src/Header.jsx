import React, { useEffect, useState } from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';

const Header = ({ user, onLogout }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Inicializar tema guardado
    const savedTheme = localStorage.getItem('tripoliven-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (window.electronAPI && window.electronAPI.setTheme) {
      window.electronAPI.setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('tripoliven-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    if (window.electronAPI && window.electronAPI.setTheme) {
      window.electronAPI.setTheme(newTheme);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '12px 160px 24px 0', // 160px de padding derecho para dejar el espacio exacto a los botones nativos de Windows [ - ] [ [] ] [ X ]
      gap: '20px',
      position: 'relative',
      zIndex: 10,
      WebkitAppRegion: 'drag' // Permite arrastrar la ventana desde el área libre del header
    }}>
      
      {/* Botón de Cambio de Tema */}
      <button 
        onClick={toggleTheme}
        style={{
          width: '42px', height: '42px', borderRadius: '14px',
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s',
          WebkitAppRegion: 'no-drag', // Evita que arrastrar la ventana bloquee el clic
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
        onMouseOver={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
        onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
        title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Tarjeta de Información del Usuario */}
      {user && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '8px 18px', borderRadius: '16px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          WebkitAppRegion: 'no-drag',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'var(--accent-gradient)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', 
            fontWeight: 'bold', fontSize: '1rem', color: '#ffffff',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{user.system_role}</span>
          </div>
        </div>
      )}

      {/* Botón de Cerrar Sesión */}
      <button 
        onClick={onLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 20px', borderRadius: '14px',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
          transition: 'all 0.2s',
          WebkitAppRegion: 'no-drag'
        }}
        onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#ffffff'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
      >
        <LogOut size={18} />
        Cerrar Sesión
      </button>

    </div>
  );
};

export default Header;
