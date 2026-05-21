import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Briefcase, Building2, Settings, Hexagon, 
  Truck, Layers, ChevronDown, ChevronRight, ChevronLeft, Contact, TrendingUp,
  Scale, Menu, FileText
} from 'lucide-react';

const Sidebar = () => {
  // Estado para controlar el colapso del menú lateral
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('tripoliven_sidebar_collapsed');
    return saved === 'true';
  });

  // Estado para controlar qué secciones están desplegadas (solo cuando está expandido)
  const [expanded, setExpanded] = useState({
    inicio: true,
    operaciones: true,
    rrhh: true
  });

  // Sincronizar el estado del colapso del sidebar en el elemento HTML raíz
  useEffect(() => {
    const root = document.documentElement;
    if (isCollapsed) {
      root.setAttribute('data-sidebar-collapsed', 'true');
    } else {
      root.removeAttribute('data-sidebar-collapsed');
    }
    localStorage.setItem('tripoliven_sidebar_collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const toggleSection = (section) => {
    if (isCollapsed) {
      // Si está colapsado y hacen clic en la sección, lo expandimos primero
      setIsCollapsed(false);
      setExpanded(prev => ({ ...prev, [section]: true }));
    } else {
      setExpanded(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    }
  };

  return (
    <div 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* 1. LOGO Y BOTÓN DE ACCIÓN FLOTANTE */}
      <div className="sidebar-logo" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: '4px 8px', 
        borderBottom: '1px solid var(--glass-border)',
        height: '70px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div className="logo-icon">
            <Hexagon size={22} className="titlebar-logo-icon" />
          </div>
          {!isCollapsed && (
            <h1 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '800', 
              margin: 0,
              background: 'var(--accent-gradient)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-0.02em'
            }}>
              TripoliERP
            </h1>
          )}
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="sidebar-toggle-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: 'none'
          }}
          title={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* 2. CONTENEDOR DE NAVEGACIÓN */}
      <div className="nav-container" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: isCollapsed ? '12px 6px' : '12px 14px', 
        marginTop: '8px' 
      }}>
        
        {/* VISTA A: SI ESTÁ EXPANDIDO (ESTRUCTURA DE ACORDEÓN PREMIUM) */}
        {!isCollapsed ? (
          <>
            {/* CATEGORÍA 1: INICIO & MÉTRICAS */}
            <div style={{ marginBottom: '14px' }}>
              <div 
                onClick={() => toggleSection('inicio')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '0.675rem', fontWeight: '700', color: 'var(--text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', 
                  padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
                  userSelect: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>Inicio & Analítica</span>
                <span style={{ 
                  display: 'flex', alignItems: 'center',
                  transform: expanded.inicio ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s ease-in-out'
                }}>
                  <ChevronDown size={12} />
                </span>
              </div>
              
              {expanded.inicio && (
                <ul className="nav-menu" style={{ listStyle: 'none', padding: 0, margin: 0, paddingLeft: '4px' }}>
                  <li>
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                      <LayoutDashboard size={14} />
                      <span>Dashboard Principal</span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </div>

            {/* CATEGORÍA 2: OPERACIONES */}
            <div style={{ marginBottom: '14px' }}>
              <div 
                onClick={() => toggleSection('operaciones')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '0.675rem', fontWeight: '700', color: 'var(--text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', 
                  padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
                  userSelect: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>Operaciones</span>
                <span style={{ 
                  display: 'flex', alignItems: 'center',
                  transform: expanded.operaciones ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s ease-in-out'
                }}>
                  <ChevronDown size={12} />
                </span>
              </div>
              
              {expanded.operaciones && (
                <ul className="nav-menu" style={{ listStyle: 'none', padding: 0, margin: 0, paddingLeft: '4px' }}>
                  <li>
                    <NavLink to="/dispatches" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <Truck size={14} />
                      <span>Despacho de Órdenes</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <Contact size={14} />
                      <span>Clientes</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/product-types" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <Layers size={14} />
                      <span>Productos</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <FileText size={14} />
                      <span>Reportes y Análisis</span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </div>

            {/* CATEGORÍA 3: RECURSOS HUMANOS */}
            <div style={{ marginBottom: '14px' }}>
              <div 
                onClick={() => toggleSection('rrhh')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '0.675rem', fontWeight: '700', color: 'var(--text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', 
                  padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
                  userSelect: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>Personal Interno</span>
                <span style={{ 
                  display: 'flex', alignItems: 'center',
                  transform: expanded.rrhh ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s ease-in-out'
                }}>
                  <ChevronDown size={12} />
                </span>
              </div>
              
              {expanded.rrhh && (
                <ul className="nav-menu" style={{ listStyle: 'none', padding: 0, margin: 0, paddingLeft: '4px' }}>
                  <li>
                    <NavLink to="/departments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <Building2 size={14} />
                      <span>Departamentos</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/positions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <Briefcase size={14} />
                      <span>Cargos Internos</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <Users size={14} />
                      <span>Personal (Usuarios)</span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </div>
          </>
        ) : (
          /* VISTA B: SI ESTÁ COLAPSADO (COLUMNA LINEAL DE ÍCONOS CON TOOLTIPS) */
          <ul className="nav-menu" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <li>
              <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-tooltip="Dashboard Principal" end>
                <LayoutDashboard size={14} />
              </NavLink>
            </li>
            <li>
              <NavLink to="/dispatches" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-tooltip="Despacho de Órdenes">
                <Truck size={14} />
              </NavLink>
            </li>
            <li>
              <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-tooltip="Clientes">
                <Contact size={14} />
              </NavLink>
            </li>
            <li>
              <NavLink to="/product-types" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-tooltip="Productos">
                <Layers size={14} />
              </NavLink>
            </li>
            <li>
              <NavLink to="/departments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-tooltip="Departamentos">
                <Building2 size={14} />
              </NavLink>
            </li>
            <li>
              <NavLink to="/positions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-tooltip="Cargos Internos">
                <Briefcase size={14} />
              </NavLink>
            </li>
            <li>
              <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-tooltip="Personal (Usuarios)">
                <Users size={14} />
              </NavLink>
            </li>
          </ul>
        )}

        {/* 3. SECCIÓN COMÚN DE UTILIDADES (CON DIVISIONAL FINA) */}
        <div style={{ 
          borderTop: '1px solid var(--glass-border)', 
          paddingTop: '12px', 
          marginTop: '16px', 
          marginBottom: '16px' 
        }}>
          {isCollapsed ? (
            <ul className="nav-menu" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <li>
                <NavLink to="/legal" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-tooltip="Marco Legal & IP">
                  <Scale size={14} />
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-tooltip="Configuración del ERP">
                  <Settings size={14} />
                </NavLink>
              </li>
            <li>
  <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-tooltip="Reportes">
    <FileText size={14} />
  </NavLink>
</li>
</ul>
          ) : (
            <ul className="nav-menu" style={{ listStyle: 'none', padding: 0, margin: 0, paddingLeft: '4px' }}>
              <li>
                <NavLink to="/legal" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Scale size={14} />
                  <span>Marco Legal & IP</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Settings size={14} />
                  <span>Configuración</span>
                </NavLink>
              </li>
            </ul>
          )}
        </div>

      </div>

      {/* 4. MONITOR DE SALUD DE TI (IT MONITOR WIDGET) */}
      <div className="system-health-widget" style={{
        marginTop: 'auto',
        padding: isCollapsed ? '16px 0' : '16px',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCollapsed ? 'center' : 'flex-start',
        gap: '6px',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
        background: 'rgba(255, 255, 255, 0.01)'
      }}>
        {isCollapsed ? (
          <div 
            style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: 'var(--success)', animation: 'pulse 2s infinite',
              boxShadow: '0 0 8px var(--success)',
              cursor: 'pointer'
            }} 
            title="Servidor SQLite: Online (WAL Active)" 
          />
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <span className="led-pulse" style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--success)', display: 'inline-block',
                boxShadow: '0 0 8px var(--success)',
                animation: 'pulse 2s infinite'
              }}></span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}>Servidor SQLite: Online</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', opacity: 0.8, fontSize: '0.65rem' }}>
              <span>v1.2.0-stable</span>
              <span style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>By Vive flow dev</span>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default Sidebar;
