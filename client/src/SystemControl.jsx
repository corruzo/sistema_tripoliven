import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Shield, Search, RefreshCw, Download, Upload, 
  CheckCircle2, AlertTriangle, Clock, Terminal, HardDrive, Info
} from 'lucide-react';
import { API_BASE_URL } from './config';

const SystemControl = () => {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'database'
  const [currentUser, setCurrentUser] = useState(null);

  // Estados de Auditoría
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [debounceSearch, setDebounceSearch] = useState('');

  // Estados de Base de Datos
  const [optimizing, setOptimizing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [actionMessage, setActionMessage] = useState(null); // { type: 'success'|'error', text: '' }

  const fileInputRef = useRef(null);

  // Cargar usuario actual de localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('tripoliven_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Debounce para búsqueda de logs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Cargar logs de auditoría
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/system/audit-logs?page=${page}&limit=12&search=${encodeURIComponent(debounceSearch)}`,
        {
          headers: {
            'X-User-Id': currentUser?.id || ''
          }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalLogs(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error al cargar logs de auditoría:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, debounceSearch, currentUser]);

  // Helper para insignias de acción estilizadas
  const getActionBadge = (action) => {
    let classes = 'role-badge ';
    let label = action;

    if (action.includes('EXITOSO')) {
      classes += 'status-active';
      label = 'INICIO EXITOSO';
    } else if (action.includes('FALLIDO') || action.includes('ERROR')) {
      classes += 'status-inactive';
      label = action.includes('FALLIDO') ? 'ACCESO RECHAZADO' : 'ERROR SISTEMA';
    } else if (action.includes('CREADO')) {
      classes += 'role-Admin';
      label = 'NUEVO REGISTRO';
    } else if (action.includes('EDITADO') || action.includes('MODIFICADO')) {
      classes += '';
      label = 'MODIFICACIÓN';
    } else if (action.includes('ELIMINADO') || action.includes('ANULADO')) {
      classes += 'status-inactive';
      label = action.includes('ANULADO') ? 'ANULACIÓN' : 'ELIMINACIÓN';
    } else if (action.includes('BASE_DATOS') || action.includes('RESPALDO')) {
      classes += 'role-Admin';
      label = 'MANTENIMIENTO';
    }

    return (
      <span className={classes} style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
    );
  };

  // Optimizar base de datos (VACUUM)
  const handleOptimize = async () => {
    if (optimizing) return;
    setOptimizing(true);
    setActionMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/system/backup/optimize`, {
        method: 'POST',
        headers: {
          'X-User-Id': currentUser?.id || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActionMessage({ type: 'success', text: data.message || 'Base de datos optimizada y compactada correctamente.' });
        fetchLogs(); // Recargar logs para ver la acción
      } else {
        const errData = await res.json();
        setActionMessage({ type: 'error', text: errData.error || 'Fallo en la optimización del sistema.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error de red al intentar optimizar la base de datos.' });
    } finally {
      setOptimizing(false);
    }
  };

  // Descargar base de datos
  const handleBackup = () => {
    setActionMessage(null);
    try {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}/api/system/backup`;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Esperar un segundo y recargar los logs
      setTimeout(fetchLogs, 1500);
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error al iniciar la descarga del respaldo.' });
    }
  };

  // Restaurar base de datos
  const handleRestoreClick = () => {
    if (restoring) return;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.sql')) {
      setActionMessage({ type: 'error', text: 'Por favor selecciona un archivo de respaldo SQL válido (.sql).' });
      return;
    }

    if (!window.confirm('🚨 ADVERTENCIA CRÍTICA: Restaurar la base de datos reemplazará TODOS los datos actuales de camiones, despachos, clientes y usuarios. ¿Estás absolutamente seguro de continuar?')) {
      e.target.value = '';
      return;
    }

    setRestoring(true);
    setRestoreProgress(20);
    setActionMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setRestoreProgress(50);
        const arrayBuffer = event.target.result;
        
        const res = await fetch(`${API_BASE_URL}/api/system/backup/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-User-Id': currentUser?.id || ''
          },
          body: arrayBuffer
        });

        setRestoreProgress(90);
        const data = await res.json();

        if (res.ok) {
          setRestoreProgress(100);
          setShowCountdownModal(true);
          setActionMessage({ type: 'success', text: data.message || 'Restauración completada.' });
          
          // Iniciar cuenta regresiva para el reinicio automático del sistema
          let count = 5;
          const interval = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count <= 0) {
              clearInterval(interval);
              // Cerrar sesión y forzar recarga de página para reconectar
              localStorage.clear();
              window.location.href = '/';
            }
          }, 1000);
        } else {
          setActionMessage({ type: 'error', text: data.error || 'Error al restaurar la base de datos.' });
          setRestoring(false);
        }
      } catch (err) {
        setActionMessage({ type: 'error', text: 'Error en la conexión al subir el respaldo.' });
        setRestoring(false);
      } finally {
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      setActionMessage({ type: 'error', text: 'Error de lectura del archivo local.' });
      setRestoring(false);
      e.target.value = '';
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="main-content-scrollable" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '30px' }}>
      
      {/* Cabecera del Panel */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.8rem', fontWeight: '800' }}>
            <Database color="var(--accent-primary)" size={28} />
            Panel de Control del Sistema
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Infraestructura de base de datos, bitácora de auditoría digital y mantenimiento corporativo.
          </p>
        </div>

        {/* Estatus Rápido del Servidor */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', 
          padding: '8px 16px', borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)',
          color: 'var(--success)', fontSize: '0.8rem', fontWeight: '600'
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--success)', animation: 'pulse 1.5s infinite',
            boxShadow: '0 0 8px var(--success)'
          }}></span>
          SQLite Engine: WAL Active
        </div>
      </div>

      {/* Tabs Switcher Glassmorphic */}
      <div style={{
        display: 'flex', gap: '8px', padding: '6px', 
        borderRadius: '16px', background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)', width: 'fit-content',
        marginBottom: '20px', zIndex: 10
      }}>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '12px',
            border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
            background: activeTab === 'audit' ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === 'audit' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'audit' ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          <Shield size={16} />
          Bitácora de Auditoría
        </button>
        <button
          onClick={() => setActiveTab('database')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '12px',
            border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
            background: activeTab === 'database' ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === 'database' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'database' ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          <HardDrive size={16} />
          Utilidades de Base de Datos
        </button>
      </div>

      {/* Mensajes de Acción Global */}
      {actionMessage && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 18px', borderRadius: '14px',
          marginBottom: '20px', fontSize: '0.85rem', fontWeight: '500',
          background: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          color: actionMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{actionMessage.text}</span>
          <button 
            onClick={() => setActionMessage(null)}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* CONTENIDO DE TAB 1: BITÁCORA DE AUDITORÍA */}
      {activeTab === 'audit' && (
        <div className="table-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Barra de Filtro de Búsqueda */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Buscar por usuario, acción, detalle o IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 16px 10px 42px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
                  color: 'white', fontSize: '0.85rem'
                }}
              />
            </div>
            
            <button
              onClick={fetchLogs}
              disabled={loadingLogs}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.03)'}
            >
              <RefreshCw size={14} className={loadingLogs ? 'spinning-logo-slow' : ''} />
              Refrescar Bitácora
            </button>
          </div>

          {/* Tabla de Logs */}
          <div className="table-scrollable" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="modern-table compact-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Fecha y Hora</th>
                  <th style={{ width: '150px' }}>Usuario</th>
                  <th style={{ width: '180px' }}>Acción</th>
                  <th>Detalles de Operación</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>IP Remota</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      <RefreshCw size={24} className="spinning-logo-slow" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                      Consultando registros de auditoría en la base de datos...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      <Info size={24} style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.5 }} />
                      No se encontraron registros de auditoría que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const dateObj = new Date(log.createdAt);
                    const formattedDate = dateObj.toLocaleDateString('es-VE', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    });
                    const formattedTime = dateObj.toLocaleTimeString('es-VE', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });

                    return (
                      <tr key={log.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formattedDate}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{formattedTime}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: '600', color: 'white' }}>{log.user_name || 'Sistema Externo'}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>@{log.user_username || 'system'}</span>
                          </div>
                        </td>
                        <td>{getActionBadge(log.action)}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {log.details}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '10px'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Mostrando logs de auditoría (Total: <strong>{totalLogs}</strong> registros)
              </span>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.02)', color: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem', opacity: page === 1 ? 0.4 : 1
                  }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: '0.85rem', color: 'white', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  Pág. {page} de {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.02)', color: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem', opacity: page === totalPages ? 0.4 : 1
                  }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO DE TAB 2: UTILIDADES DE BASE DE DATOS */}
      {activeTab === 'database' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="compact-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            
            {/* CARD A: OPTIMIZACIÓN (VACUUM) */}
            <div className="stat-card" style={{ 
              flexDirection: 'column', alignItems: 'flex-start', gap: '16px', padding: '24px !important',
              background: 'var(--glass-bg)', height: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="stat-icon blue" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                  <Terminal size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', margin: 0, textTransform: 'none', letterSpacing: 'none' }}>
                    Compactar y Optimizar
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mantenimiento SQLite VACUUM</span>
                </div>
              </div>
              
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'left', lineHeight: '1.5', minHeight: '60px' }}>
                Desfragmente el archivo físico de base de datos de Tripoliven, reduzca el espacio de almacenamiento del disco en planta y limpie registros huérfanos de despachos anteriores al instante.
              </p>

              <button
                onClick={handleOptimize}
                disabled={optimizing}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  background: 'var(--accent-gradient)', border: 'none',
                  color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.target.style.opacity = '0.9'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                {optimizing ? (
                  <>
                    <RefreshCw size={16} className="spinning-logo-slow" />
                    Ejecutando Compresión...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Compactar SQLite
                  </>
                )}
              </button>
            </div>

            {/* CARD B: DESCARGAR RESPALDO */}
            <div className="stat-card" style={{ 
              flexDirection: 'column', alignItems: 'flex-start', gap: '16px', padding: '24px !important',
              background: 'var(--glass-bg)', height: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="stat-icon green" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                  <Download size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', margin: 0, textTransform: 'none', letterSpacing: 'none' }}>
                    Copia de Seguridad
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Respaldo Corporativo Offline</span>
                </div>
              </div>
              
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'left', lineHeight: '1.5', minHeight: '60px' }}>
                Genere y descargue una copia física idéntica (`.sqlite`) de su base de datos local actual. Este archivo contiene todo el historial de despachos de camiones y puede resguardarse de forma segura en la planta.
              </p>

              <button
                onClick={handleBackup}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none',
                  color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.target.style.opacity = '0.9'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                <Download size={16} />
                Descargar Archivo .sqlite
              </button>
            </div>

            {/* CARD C: RESTAURAR RESPALDO */}
            <div className="stat-card" style={{ 
              flexDirection: 'column', alignItems: 'flex-start', gap: '16px', padding: '24px !important',
              background: 'var(--glass-bg)', height: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="stat-icon red" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                  <Upload size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', margin: 0, textTransform: 'none', letterSpacing: 'none' }}>
                    Restaurar Respaldo
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Importar Archivo SQLite</span>
                </div>
              </div>
              
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'left', lineHeight: '1.5', minHeight: '60px' }}>
                Sobrescriba la base de datos activa subiendo un archivo de copia anterior. El sistema validará la firma de seguridad interna y realizará un reinicio de servicio automatizado para evitar corrupción.
              </p>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".sql" 
                style={{ display: 'none' }} 
              />

              <button
                onClick={handleRestoreClick}
                disabled={restoring}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: 'none',
                  color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.target.style.opacity = '0.9'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                {restoring ? (
                  <>
                    <RefreshCw size={16} className="spinning-logo-slow" />
                    Subiendo ({restoreProgress}%)
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Subir y Restaurar DB
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Caja Informativa de Seguridad de Datos */}
          <div style={{
            display: 'flex', gap: '16px', padding: '18px', borderRadius: '16px',
            background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)',
            color: 'var(--warning)', fontSize: '0.85rem', lineHeight: '1.5', marginTop: '10px'
          }}>
            <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '4px', color: '#f59e0b', fontSize: '0.9rem' }}>
                Políticas de Seguridad de Datos del Sistema (Vive flow dev)
              </strong>
              Para garantizar que el sistema nunca caiga y no existan fallos de concurrencia:
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                <li>La restauración se realiza mediante transacciones atómicas con <strong>Zero Downtime</strong>. Si un error ocurre, se revierte automáticamente sin corromper datos.</li>
                <li>PostgreSQL opera bajo el estricto control de concurrencia multiversión (MVCC), garantizando que cientos de usuarios puedan facturar sin bloqueos.</li>
                <li>Todos los respaldos y optimizaciones se registran de forma inmutable en la bitácora digital de auditoría, incluyendo la fecha, usuario administrador e IP remota.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GORGEOUS DE CUENTA REGRESIVA TRAS RESTAURACIÓN */}
      {showCountdownModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(16px)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '40px',
            width: '450px',
            textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
            color: 'white',
            fontFamily: 'Outfit, sans-serif'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto',
              animation: 'pulse 1.5s infinite'
            }}>
              <CheckCircle2 size={32} color="#10b981" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 10px 0', color: '#10b981' }}>
              Base de Datos Restaurada
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              Los archivos de despachos, clientes y personal han sido importados con éxito. 
              Aplicando nueva sesión segura en:
              <strong style={{ color: 'white', display: 'block', fontSize: '2.5rem', marginTop: '12px', fontFamily: 'monospace', textShadow: '0 0 10px rgba(99, 102, 241, 0.5)' }}>
                {countdown}
              </strong>
            </p>

            <div style={{
              width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)',
              borderRadius: '3px', overflow: 'hidden', marginBottom: '10px'
            }}>
              <div style={{
                width: `${(countdown / 5) * 100}%`, height: '100%',
                background: 'var(--accent-gradient)', borderRadius: '3px',
                transition: 'width 1s linear'
              }}></div>
            </div>
            
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Reconectando con el motor PostgreSQL...
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

export default SystemControl;
