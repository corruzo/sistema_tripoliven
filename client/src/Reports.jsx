import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';
import { exportDispatchesToPDF } from './utils/pdfExport';
import { 
  Calendar, FileText, Download, Search, Filter, Layers, 
  Users, TrendingUp, MapPin, Award, Clock, ArrowLeft, Package
} from 'lucide-react';

// Helper para calcular el rango del mes calendario actual
const getMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
  };
};

const Reports = () => {
  const navigate = useNavigate();
  
  // Rango de fechas por defecto (Mes actual)
  const defaultRange = getMonthRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  // Estados de datos
  const [dispatches, setDispatches] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [productTypesList, setProductTypesList] = useState([]);
  
  // Estados de filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  // Navegación de pestañas para las gráficas
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'states' | 'months' | 'clients'
  
  // Tipo de reporte para la exportación PDF
  const [reportType, setReportType] = useState('general');

  // Estados operativos de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Paginación de la tabla
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Cargar catálogos de filtros de cliente y tipos de producto al montar
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [clientsRes, productsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/clients`),
          fetch(`${API_BASE_URL}/api/product-types`)
        ]);
        
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClientsList(clientsData);
        }
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProductTypesList(productsData);
        }
      } catch (err) {
        console.error('Error cargando catálogos de filtros:', err);
      }
    };
    loadCatalogs();
  }, []);

  // Cargar despachos desde el backend en base a las fechas seleccionadas
  const fetchDispatches = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE_URL}/api/dispatches`;
      const params = [];
      // Robustez defensiva: enviar el rango completo del día
      if (startDate) params.push(`startDate=${startDate}T00:00:00`);
      if (endDate) params.push(`endDate=${endDate}T23:59:59`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Error al conectar con la base de datos');
      }
      const data = await res.json();
      setDispatches(data || []);
    } catch (err) {
      console.error('Error fetching dispatches for reports:', err);
      setError('Error al obtener registros del backend. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Re-cargar cada vez que cambia el rango de fechas
  useEffect(() => {
    fetchDispatches();
  }, [startDate, endDate]);

  // Limpiar paginación si cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, productTypeFilter, clientFilter, statusFilter]);

  // ==========================================
  // FILTRADO REACTIVO EN MEMORIA (CLIENTE)
  // ==========================================
  const filteredDispatches = useMemo(() => {
    let result = [...dispatches];

    if (productTypeFilter.trim() !== '') {
      result = result.filter(d => d.product_type && d.product_type.toLowerCase().includes(productTypeFilter.toLowerCase()));
    }

    if (clientFilter.trim() !== '') {
      result = result.filter(d => d.client_name && d.client_name.toLowerCase().includes(clientFilter.toLowerCase()));
    }

    if (stateFilter.trim() !== '') {
      result = result.filter(d => {
        const state = d.destination_state || d.destination_location;
        return state && state.toLowerCase().includes(stateFilter.toLowerCase());
      });
    }

    if (statusFilter !== 'Todos') {
      result = result.filter(d => d.status === statusFilter);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        (d.client_name && d.client_name.toLowerCase().includes(q)) || 
        (d.order_number && d.order_number.toLowerCase().includes(q)) ||
        (d.destination_state && d.destination_state.toLowerCase().includes(q)) ||
        (d.driver_name && d.driver_name.toLowerCase().includes(q)) ||
        (d.license_plate && d.license_plate.toLowerCase().includes(q))
      );
    }

    return result;
  }, [dispatches, searchQuery, productTypeFilter, clientFilter, stateFilter, statusFilter]);

  // Lista dinámica de estados (destinos) para el combobox
  const destinationsList = useMemo(() => {
    const set = new Set();
    dispatches.forEach(d => {
      const state = d.destination_state || d.destination_location;
      if (state) set.add(state);
    });
    return Array.from(set).sort();
  }, [dispatches]);

  // ==========================================
  // MÉTDRICAS KPI DILUÍDAS REACTIVAMENTE
  // ==========================================
  const activeForMetrics = useMemo(() => {
    return filteredDispatches.filter(d => d.status !== 'Anulado');
  }, [filteredDispatches]);

  const totalQuantity = useMemo(() => {
    const sum = activeForMetrics.reduce((acc, d) => acc + Number(d.quantity_tm || 0), 0);
    return Math.round(sum * 1000) / 1000;
  }, [activeForMetrics]);

  const avgQuantity = useMemo(() => {
    if (activeForMetrics.length === 0) return 0;
    return Math.round((totalQuantity / activeForMetrics.length) * 100) / 100;
  }, [activeForMetrics, totalQuantity]);

  const activeDispatchesCount = useMemo(() => {
    return activeForMetrics.filter(d => d.status !== 'Entregado').length;
  }, [activeForMetrics]);

  // ==========================================
  // AGREGACIONES REACTIVAS PARA GRÁFICOS
  // ==========================================
  const productColors = {
    'Tripolifosfato': '#3b82f6',
    'Ácido Fosfórico': '#10b981',
    'Pirofosfato': '#8b5cf6',
    'Otros': '#06b6d4'
  };
  const defaultColorPalette = ['#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#6366f1'];

  const productsArray = useMemo(() => {
    const map = {};
    activeForMetrics.forEach(d => {
      const prod = d.product_type || 'Otros';
      map[prod] = (map[prod] || 0) + Number(d.quantity_tm || 0);
    });
    return Object.keys(map).map((name) => ({
      name,
      value: Math.round(map[name] * 1000) / 1000
    })).sort((a, b) => b.value - a.value);
  }, [activeForMetrics]);

  const destinationsArray = useMemo(() => {
    const map = {};
    activeForMetrics.forEach(d => {
      const state = d.destination_state || 'Otro';
      map[state] = (map[state] || 0) + Number(d.quantity_tm || 0);
    });
    return Object.keys(map).map(name => ({
      name,
      value: Math.round(map[name] * 1000) / 1000
    })).sort((a, b) => b.value - a.value);
  }, [activeForMetrics]);

  const monthsArray = useMemo(() => {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const map = {};
    activeForMetrics.forEach(d => {
      const dateStr = d.dispatch_datetime ? d.dispatch_datetime.split('T')[0] : '';
      if (dateStr) {
        const parts = dateStr.split('-');
        if (parts.length >= 2) {
          const year = parts[0];
          const monthNum = parseInt(parts[1], 10);
          const label = `${monthNames[monthNum - 1]} ${year}`;
          const rawKey = dateStr.substring(0, 7);
          if (!map[rawKey]) {
            map[rawKey] = { label, tm: 0 };
          }
          map[rawKey].tm += Number(d.quantity_tm || 0);
        }
      }
    });
    return Object.keys(map).map(rawKey => ({
      name: map[rawKey].label,
      rawKey,
      value: Math.round(map[rawKey].tm * 1000) / 1000
    })).sort((a, b) => a.rawKey.localeCompare(b.rawKey));
  }, [activeForMetrics]);

  const clientsArray = useMemo(() => {
    const map = {};
    activeForMetrics.forEach(d => {
      const client = d.client_name || 'Desconocido';
      map[client] = (map[client] || 0) + Number(d.quantity_tm || 0);
    });
    return Object.keys(map).map(name => ({
      name,
      value: Math.round(map[name] * 1000) / 1000
    })).sort((a, b) => b.value - a.value);
  }, [activeForMetrics]);

  // Paginación lógica
  const totalPages = Math.ceil(filteredDispatches.length / itemsPerPage);
  const currentTableRows = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredDispatches.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredDispatches, currentPage]);

  // Manejar exportación sincronizada
  const handleExport = () => {
    if (filteredDispatches.length === 0) {
      alert('No hay registros de despachos con los filtros actuales para exportar.');
      return;
    }
    // Llamar directamente pasando el subconjunto filtrado y los filtros descriptivos activos
    exportDispatchesToPDF(
      filteredDispatches, 
      startDate, 
      endDate, 
      totalQuantity, 
      {
        productType: productTypeFilter,
        client: clientFilter,
        state: stateFilter,
        status: statusFilter,
        searchQuery: searchQuery
      }, 
      reportType
    );
  };

  const hasData = filteredDispatches.length > 0;

  return (
    <div style={{ padding: '24px', color: 'white', fontFamily: 'Outfit, sans-serif', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* CABECERA DE LA PÁGINA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
              <FileText size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Reportes & Analítica Unificada
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Visualiza métricas avanzadas, explora diagramas analíticos en tiempo real y exporta reportes PDF fieles a tu filtro.
          </p>
        </div>
        
        {/* INDICADOR EN VIVO */}
        <span style={{ 
          fontSize: '0.75rem', 
          background: 'rgba(16, 185, 129, 0.15)', 
          color: 'var(--success)', 
          padding: '6px 12px', 
          borderRadius: '8px', 
          fontWeight: '700', 
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          height: 'fit-content'
        }}>
          <span className="led-pulse" style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: 'var(--success)',
            display: 'inline-block'
          }} />
          Sincronización Activa
        </span>
      </div>

      {/* BLOQUE DE FILTROS AVANZADOS GLASSMORPHIC */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(15, 23, 42, 0.25)', border: '1px solid var(--glass-border)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--accent-primary)" /> Panel de Control y Filtrado
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          
          {/* Rango de Fecha Desde */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Fecha Desde</label>
            <input 
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Rango de Fecha Hasta */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Fecha Hasta</label>
            <input 
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Filtro por Producto */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Línea de Producto</label>
            <input
              type="text"
              list="product-list"
              placeholder="Buscar producto..."
              value={productTypeFilter}
              onChange={e => setProductTypeFilter(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
              }}
            />
            <datalist id="product-list">
              {productTypesList.map(pt => (
                <option key={pt.id} value={pt.name} />
              ))}
              {productTypesList.length === 0 && (
                <>
                  <option value="Tripolifosfato" />
                  <option value="Ácido Fosfórico" />
                  <option value="Pirofosfato" />
                </>
              )}
            </datalist>
          </div>

          {/* Filtro por Cliente */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Cliente Corporativo</label>
            <input
              type="text"
              list="client-list"
              placeholder="Buscar cliente..."
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
              }}
            />
            <datalist id="client-list">
              {clientsList.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          {/* Filtro por Estado (Destino) */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Estado (Destino)</label>
            <input
              type="text"
              list="state-list"
              placeholder="Buscar estado..."
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
              }}
            />
            <datalist id="state-list">
              {destinationsList.map((state, idx) => (
                <option key={idx} value={state} />
              ))}
            </datalist>
          </div>

          {/* Filtro por Estatus */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Estatus Despacho</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              <option value="Todos">Todos los Estatus</option>
              <option value="Despachado">Despachado</option>
              <option value="En Ruta">En Ruta</option>
              <option value="Entregado">Entregado</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>

          {/* Búsqueda Directa Textbox */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Búsqueda Rápida</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Buscar RIF, conductor, factura..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 30px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                  color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

        </div>

        {/* BOTONERA ACCESOS RÁPIDOS Y LIMPIEZA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                const range = getMonthRange();
                setStartDate(range.start);
                setEndDate(range.end);
              }}
              style={{
                background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
                color: '#60a5fa', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem',
                fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Calendar size={12} /> Mes Actual
            </button>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem',
                fontWeight: '600', cursor: 'pointer'
              }}
            >
              Ver Todo el Historial
            </button>
          </div>

          {(startDate || endDate || searchQuery || productTypeFilter.trim() !== '' || clientFilter.trim() !== '' || stateFilter.trim() !== '' || statusFilter !== 'Todos') && (
            <button
              onClick={() => {
                setStartDate(defaultRange.start);
                setEndDate(defaultRange.end);
                setSearchQuery('');
                setProductTypeFilter('');
                setClientFilter('');
                setStateFilter('');
                setStatusFilter('Todos');
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: '600', fontSize: '0.8rem'
              }}
            >
              Reestablecer Filtros
            </button>
          )}
        </div>
      </div>

      {/* ERROR MESSAGE BAR */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.85rem', color: '#f87171'
        }}>
          {error}
        </div>
      )}

      {/* DOCK DE METRICAS KPI REACTIVAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* KPI 1: CANTIDAD TOTAL EN TM */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Tons Despachadas</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'white' }}>
              {totalQuantity.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '400' }}>TM</span>
            </span>
          </div>
        </div>

        {/* KPI 2: TOTAL DE DESPACHOS EN RANGO */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Layers size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Viajes Registrados</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'white' }}>{filteredDispatches.length}</span>
          </div>
        </div>

        {/* KPI 3: PROMEDIO DE CARGA */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Package size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Promedio de Carga</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'white' }}>
              {avgQuantity.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '400' }}>TM</span>
            </span>
          </div>
        </div>

        {/* KPI 4: DESPACHOS ACTIVOS/TRANSITO */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Pendientes/Tránsito</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'white' }}>{activeDispatchesCount}</span>
          </div>
        </div>

      </div>

      {/* SECCIÓN ANALÍTICA E INTERACTIVA DE GRÁFICOS */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
        
        {/* ENCABEZADO Y TABS DE CONTROL DEL GRÁFICO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--accent-primary)" /> Distribución Analítica Integrada
          </h3>

          <div style={{ 
            display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '4px', 
            borderRadius: '12px', border: '1px solid var(--glass-border)'
          }}>
            {[
              { id: 'products', name: 'Productos', icon: Package },
              { id: 'states', name: 'Destinos (Estados)', icon: MapPin },
              { id: 'months', name: 'Evolución Mensual', icon: Calendar },
              { id: 'clients', name: 'Top Clientes', icon: Users }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                    borderRadius: '8px', border: 'none', background: isActive ? 'var(--accent-gradient)' : 'transparent',
                    color: isActive ? 'white' : 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <TabIcon size={14} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RENDERIZADO DEL PANEL DEL GRÁFICO SELECCIONADO */}
        {loading ? (
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Cargando analíticas...
          </div>
        ) : !hasData ? (
          <div style={{ height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '8px' }}>
            <TrendingUp size={36} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Sin datos analíticos para mostrar en este rango</span>
          </div>
        ) : (
          <div style={{ minHeight: '260px' }}>
            
            {/* TABS 1: PARTICIPACIÓN DE PRODUCTOS (DONUT CHART SVG) */}
            {activeTab === 'products' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', gap: '24px', padding: '12px' }}>
                <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                  <svg width="180" height="180" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                    {(() => {
                      let accumulatedPercent = 0;
                      return productsArray.map((item, idx) => {
                        const percent = totalQuantity > 0 ? (item.value / totalQuantity) * 100 : 0;
                        const strokeDasharray = `${percent} ${100 - percent}`;
                        const strokeDashoffset = 100 - accumulatedPercent + 25; 
                        accumulatedPercent += percent;
                        const color = productColors[item.name] || defaultColorPalette[idx % defaultColorPalette.length];
                        return (
                          <circle 
                            key={item.name}
                            cx="18" cy="18" r="15.915" fill="none" 
                            stroke={color} 
                            strokeWidth="3.5" 
                            strokeDasharray={strokeDasharray} 
                            strokeDashoffset={strokeDashoffset} 
                          />
                        );
                      });
                    })()}
                    <g transform="translate(18, 18)">
                      <text x="0" y="-1" fill="var(--text-primary)" fontSize="4.5" fontWeight="bold" textAnchor="middle">
                        {totalQuantity.toFixed(1)}
                      </text>
                      <text x="0" y="4" fill="var(--text-secondary)" fontSize="2.2" textAnchor="middle">
                        TM Totales
                      </text>
                    </g>
                  </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '240px', flex: 1 }}>
                  {productsArray.map((item, idx) => {
                    const percent = totalQuantity > 0 ? (item.value / totalQuantity) * 100 : 0;
                    const color = productColors[item.name] || defaultColorPalette[idx % defaultColorPalette.length];
                    return (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, display: 'inline-block' }}></span>
                          <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'white' }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <strong style={{ color: 'white' }}>{percent.toFixed(1)}%</strong> ({item.value.toFixed(2)} TM)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: GEOGRAFÍA POR ESTADO (DISTRIBUCIÓN DE BARRAS) */}
            {activeTab === 'states' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '12px' }}>
                {destinationsArray.slice(0, 5).map((dest, idx) => {
                  const percent = totalQuantity > 0 ? (dest.value / totalQuantity) * 100 : 0;
                  return (
                    <div key={dest.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: '600', color: 'white' }}>
                          <span style={{ color: 'var(--text-secondary)', marginRight: '6px' }}>{idx + 1}.</span> {dest.name}
                        </span>
                        <span style={{ color: '#10b981', fontWeight: '700' }}>
                          {dest.value.toFixed(2)} TM <span style={{ fontWeight: '400', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>({percent.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: EVOLUCIÓN HISTÓRICA POR MES */}
            {activeTab === 'months' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '12px' }}>
                {monthsArray.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>Historial del período sin despachos.</div>
                ) : (
                  monthsArray.map((m) => {
                    const percent = totalQuantity > 0 ? (m.value / totalQuantity) * 100 : 0;
                    return (
                      <div key={m.rawKey} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} color="#818cf8" /> {m.name}
                          </span>
                          <span style={{ color: '#818cf8', fontWeight: '700' }}>
                            {m.value.toFixed(2)} TM <span style={{ fontWeight: '400', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>({percent.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', borderRadius: '5px' }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 4: TOP CLIENTES CON MEDALLAS */}
            {activeTab === 'clients' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
                {clientsArray.slice(0, 5).map((client, idx) => {
                  const percent = totalQuantity > 0 ? (client.value / totalQuantity) * 100 : 0;
                  const isTop3 = idx < 3;
                  return (
                    <div 
                      key={client.name} 
                      style={{ 
                        display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', 
                        borderRadius: '10px', background: isTop3 ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                        border: isTop3 ? '1px solid rgba(59, 130, 246, 0.1)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isTop3 ? <Award size={16} color="#f59e0b" /> : <span style={{ color: 'var(--text-secondary)', width: '16px' }}>{idx + 1}.</span>}
                          {client.name}
                        </span>
                        <span style={{ color: '#3b82f6', fontWeight: '700' }}>
                          {client.value.toFixed(2)} TM <span style={{ fontWeight: '400', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>({percent.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: isTop3 ? 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)' : 'rgba(255,255,255,0.2)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ACCIONES DE EXPORTACIÓN A PDF CORPORATIVO */}
      <div className="card" style={{ 
        padding: '20px', marginBottom: '24px', background: 'rgba(99, 102, 241, 0.03)', 
        border: '1px dashed rgba(99, 102, 241, 0.25)', display: 'flex', justifyContent: 'space-between', 
        alignItems: 'center', flexWrap: 'wrap', gap: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.08)', color: '#818cf8' }}>
            <Download size={22} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'white', fontWeight: '700' }}>Exportación Sincronizada a PDF Corporativo</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>El documento final contendrá exactamente los registros filtrados arriba.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: '10px',
                background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              <option value="general">Reporte General (con Gráficos)</option>
              <option value="client">Reporte Detallado por Cliente</option>
              <option value="product">Reporte Detallado por Producto</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              fontSize: '0.85rem',
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Download size={16} />
            Exportar PDF Filtrado
          </button>
        </div>
      </div>

      {/* SECCIÓN DETALLE: TABLA DE REGISTROS FILTRADOS */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        
        {/* CABECERA TABLA */}
        <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'white', margin: 0 }}>
            Listado de Registros Sincronizados ({filteredDispatches.length})
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Mostrando {filteredDispatches.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredDispatches.length)}
          </span>
        </div>

        {/* RENDERIZADO TABLA */}
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Cargando registros de despachos...
          </div>
        ) : filteredDispatches.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Ningún despacho coincide con los criterios de filtrado seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Orden / Factura</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Cliente</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Producto</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Cantidad (TM)</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Estado Destino</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Fecha Salida</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {currentTableRows.map(d => {
                  const isAnulado = d.status === 'Anulado';
                  return (
                    <tr 
                      key={d.id} 
                      style={{ 
                        borderBottom: '1px solid var(--glass-border)', 
                        opacity: isAnulado ? 0.45 : 1,
                        background: isAnulado ? 'rgba(239, 68, 68, 0.01)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '0.85rem' }}>{d.order_number || '-'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{d.client_name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '400' }}>{d.client_rif}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{d.product_type}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', fontSize: '0.85rem' }}>
                        {Number(d.quantity_tm).toFixed(2)} tm
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={12} color="#f43f5e" /> {d.destination_state}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {d.dispatch_datetime ? d.dispatch_datetime.replace('T', ' ') : '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '30px', fontSize: '0.7rem', fontWeight: '600', display: 'inline-block',
                          background: d.status === 'Entregado' ? 'rgba(16,185,129,0.1)' : d.status === 'En Ruta' ? 'rgba(245,158,11,0.1)' : d.status === 'Anulado' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                          color: d.status === 'Entregado' ? '#34d399' : d.status === 'En Ruta' ? '#fbbf24' : d.status === 'Anulado' ? '#f87171' : '#818cf8',
                          border: `1px solid ${d.status === 'Entregado' ? 'rgba(16,185,129,0.2)' : d.status === 'En Ruta' ? 'rgba(245,158,11,0.2)' : d.status === 'Anulado' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'}`
                        }}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINACIÓN CON CONTROLES */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.02)', color: currentPage === 1 ? 'var(--text-secondary)' : 'white',
                fontSize: '0.8rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Anterior
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.02)', color: currentPage === totalPages ? 'var(--text-secondary)' : 'white',
                fontSize: '0.8rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Siguiente
            </button>
          </div>
        )}

      </div>
      
    </div>
  );
};

export default Reports;
