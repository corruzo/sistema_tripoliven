import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Briefcase, Building2, Settings, LogOut, Hexagon, 
  Truck, Layers, ChevronDown, ChevronRight, Contact
} from 'lucide-react';

const Sidebar = ({ user, onLogout }) => {
  // Estado para controlar qué secciones están desplegadas
  const [expanded, setExpanded] = useState({
    principal: true,
    logistica: true,
    estructura: true,
    talento: true
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Hexagon size={28} />
        </div>
        <h1>OmniDispatch</h1>
      </div>

      <div className="nav-container" style={{ flex: 1, overflowY: 'auto', padding: '0 16px', marginTop: '16px' }}>
        
        {/* SECTION 1: PRINCIPAL */}
        <div style={{ marginBottom: '16px' }}>
          <div 
            onClick={() => toggleSection('principal')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.675rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', 
              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
              userSelect: 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>Principal</span>
            {expanded.principal ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          
          {expanded.principal && (
            <ul className="nav-menu" style={{ listStyle: 'none', padding: 0, margin: 0, paddingLeft: '8px' }}>
              <li>
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </NavLink>
              </li>
            </ul>
          )}
        </div>

        {/* SECTION 2: LOGÍSTICA & DESPACHOS */}
        <div style={{ marginBottom: '16px' }}>
          <div 
            onClick={() => toggleSection('logistica')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.675rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', 
              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
              userSelect: 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>Operaciones</span>
            {expanded.logistica ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          
          {expanded.logistica && (
            <ul className="nav-menu" style={{ listStyle: 'none', padding: 0, margin: 0, paddingLeft: '8px' }}>
              <li>
                <NavLink to="/dispatches" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Truck size={18} />
                  <span>Registro de Despachos</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Contact size={18} />
                  <span>Clientes</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/product-types" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Layers size={18} />
                  <span>Productos</span>
                </NavLink>
              </li>
            </ul>
          )}
        </div>

        {/* SECTION 3: ESTRUCTURA EMPRESARIAL */}
        <div style={{ marginBottom: '16px' }}>
          <div 
            onClick={() => toggleSection('estructura')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.675rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', 
              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
              userSelect: 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>Empresa</span>
            {expanded.estructura ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          
          {expanded.estructura && (
            <ul className="nav-menu" style={{ listStyle: 'none', padding: 0, margin: 0, paddingLeft: '8px' }}>
              <li>
                <NavLink to="/departments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Building2 size={18} />
                  <span>Departamentos</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/positions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Briefcase size={18} />
                  <span>Cargos</span>
                </NavLink>
              </li>
            </ul>
          )}
        </div>

        {/* SECTION 4: GESTIÓN DE PERSONAL */}
        <div style={{ marginBottom: '16px' }}>
          <div 
            onClick={() => toggleSection('talento')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.675rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', 
              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
              userSelect: 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>Personal</span>
            {expanded.talento ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          
          {expanded.talento && (
            <ul className="nav-menu" style={{ listStyle: 'none', padding: 0, margin: 0, paddingLeft: '8px' }}>
              <li>
                <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Users size={18} />
                  <span>Usuarios</span>
                </NavLink>
              </li>
            </ul>
          )}
        </div>

        {/* UTILITIES SECTION */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', marginTop: '16px' }}>
          <ul className="nav-menu" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <a href="#" className="nav-item">
                <Settings size={18} />
                <span>Configuración</span>
              </a>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;
