import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Truck, Search, Calendar, FileText, Plus, Edit2, Trash2, 
  ChevronRight, ChevronLeft, Download, Filter, TrendingUp, Package, MapPin, 
  Layers, Users, ShieldAlert, CheckCircle2, Clock, MoreVertical, Eye, Ban, X, Building2
} from 'lucide-react';
import { exportDispatchesToPDF } from './utils/pdfExport';
import { API_BASE_URL } from './config';

// Devuelve la fecha local del sistema en formato YYYY-MM-DD (sin desfase UTC)
const getLocalDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const Dispatches = () => {
  const [dispatches, setDispatches] = useState([]);
  const [filteredDispatches, setFilteredDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [selectedDispatchDetails, setSelectedDispatchDetails] = useState(null);
  const [statusMenuPos, setStatusMenuPos] = useState(null);
  const [statusMenuDispatch, setStatusMenuDispatch] = useState(null);

  useEffect(() => {
    const handleDocClick = () => {
      setActiveDropdownId(null);
      setStatusMenuPos(null);
      setStatusMenuDispatch(null);
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);
  
  // Lista de tipos de producto dinámicos
  const [productTypesList, setProductTypesList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('Todos');
  const [clientFilter, setClientFilter] = useState('Todos');
  const [destinationFilter, setDestinationFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // PDF Export Advanced Modal States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalType, setExportModalType] = useState('current'); // 'current' or 'custom'
  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');
  const [pdfProductType, setPdfProductType] = useState('Todos');
  const [pdfClient, setPdfClient] = useState('Todos');
  const [pdfStatus, setPdfStatus] = useState('Todos');

  // Obtener valores únicos dinámicos para los filtros a partir de los despachos cargados
  const uniqueClients = useMemo(() => {
    const clients = dispatches.map(d => d.client_name).filter(Boolean);
    return [...new Set(clients)].sort();
  }, [dispatches]);

  const uniqueDestinations = useMemo(() => {
    const dests = dispatches.map(d => d.destination_location).filter(Boolean);
    return [...new Set(dests)].sort();
  }, [dispatches]);

  const navigate = useNavigate();

  // Control de visualización de gráficos
  const [showCharts, setShowCharts] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(filteredDispatches.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDispatches = filteredDispatches.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredDispatches.length, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, productTypeFilter, clientFilter, destinationFilter, statusFilter, startDate, endDate]);

  const loadProductTypes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types`);
      if (res.ok) {
        const data = await res.json();
        setProductTypesList(data);
      }
    } catch (err) {
      console.error('Error al cargar tipos de producto:', err);
    }
  };

  const loadClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/clients`);
      if (res.ok) {
        const data = await res.json();
        setClientsList(data);
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    }
  };

  const loadDispatches = async () => {
    setLoading(true);
    setError('');
    try {
      // Intentar pedir los datos con los filtros de fecha aplicados en backend
      let url = `${API_BASE_URL}/api/dispatches`;
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al conectar con la base de datos');
      const data = await res.json();
      setDispatches(data);
      setFilteredDispatches(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar al servidor. Mostrando datos locales de resguardo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
    loadProductTypes();
    loadClients();
  }, [startDate, endDate]);

  // Limpiar filtros avanzados si se desactivan
  useEffect(() => {
    if (!showAdvancedFilters) {
      setClientFilter('Todos');
      setDestinationFilter('Todos');
      setStatusFilter('Todos');
    }
  }, [showAdvancedFilters]);

  // Aplicar filtros en memoria (búsqueda, producto, cliente, destino, estado) adicionalmente
  useEffect(() => {
    let result = [...dispatches];

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        (d.client_name && d.client_name.toLowerCase().includes(q)) || 
        (d.order_number && d.order_number.toLowerCase().includes(q)) ||
        (d.destination_state && d.destination_state.toLowerCase().includes(q))
      );
    }

    if (productTypeFilter !== 'Todos') {
      result = result.filter(d => d.product_type === productTypeFilter);
    }

    if (clientFilter !== 'Todos') {
      result = result.filter(d => d.client_name === clientFilter);
    }

    if (destinationFilter !== 'Todos') {
      result = result.filter(d => d.destination_state === destinationFilter);
    }

    if (statusFilter !== 'Todos') {
      result = result.filter(d => d.status === statusFilter);
    }

    setFilteredDispatches(result);
  }, [searchQuery, productTypeFilter, clientFilter, destinationFilter, statusFilter, dispatches]);

  // (Eliminado handleOpenModal y handleSave ya que ahora usan el componente DispatchForm independiente)

  const handleDelete = async (disp) => {
    // Calcular minutos transcurridos en cliente para retroalimentación visual al usuario
    // createdAt se guarda en hora local del servidor; parseamos sin 'Z' para mantener consistencia
    const createdLocalStr = disp.createdAt ? disp.createdAt.replace(' ', 'T') : null;
    const createdDate = createdLocalStr ? new Date(createdLocalStr) : new Date();
    const now = new Date();
    const diffMs = now - createdDate;
    const diffMins = diffMs / 1000 / 60;

    let confirmMsg = '¿Seguro que deseas eliminar este registro de despacho? Esta acción no se puede deshacer.';
    if (diffMins > 20) {
      confirmMsg = 'Han transcurrido más de 20 minutos desde el registro. Para mantener la integridad de auditoría, el despacho no se eliminará físicamente, sino que se ANULARÁ en el sistema y no contará para estadísticas. ¿Deseas continuar?';
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/dispatches/${disp.id}`, { method: 'DELETE' });
      if (res.ok) {
        loadDispatches();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al procesar la solicitud.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el servidor.');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setStatusMenuPos(null);
    setStatusMenuDispatch(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/dispatches/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        loadDispatches();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al actualizar estatus.');
      }
    } catch (err) {
      alert('Error de conexión al servidor.');
    }
  };

  const handleContextMenu = (e, disp) => {
    if (disp.status === 'Anulado') return; // Inmutable
    e.preventDefault();
    e.stopPropagation();
    setStatusMenuDispatch(disp);
    setStatusMenuPos({ x: e.clientX, y: e.clientY });
    setActiveDropdownId(null);
  };

  // Exportar a PDF corporativo con filtros avanzados o vista actual
  const handleExecutePDFExport = () => {
    let dataToExport = [];
    let startD = '';
    let endD = '';
    let filtersObj = null;

    if (exportModalType === 'current') {
      dataToExport = filteredDispatches;
      startD = startDate;
      endD = endDate;
      filtersObj = {
        productType: productTypeFilter,
        client: clientFilter,
        status: statusFilter,
        searchQuery: searchQuery
      };
    } else {
      // Filtrar a mano según los filtros específicos del modal PDF
      let result = [...dispatches];
      if (pdfStartDate) {
        result = result.filter(d => d.dispatch_datetime.split('T')[0] >= pdfStartDate);
      }
      if (pdfEndDate) {
        result = result.filter(d => d.dispatch_datetime.split('T')[0] <= pdfEndDate);
      }
      if (pdfProductType !== 'Todos') {
        result = result.filter(d => d.product_type === pdfProductType);
      }
      if (pdfClient !== 'Todos') {
        result = result.filter(d => d.client_name === pdfClient);
      }
      if (pdfStatus !== 'Todos') {
        result = result.filter(d => d.status === pdfStatus);
      }
      dataToExport = result;
      startD = pdfStartDate;
      endD = pdfEndDate;
      filtersObj = {
        productType: pdfProductType,
        client: pdfClient,
        status: pdfStatus,
        searchQuery: ''
      };
    }

    const activeForMetrics = dataToExport.filter(d => d.status !== 'Anulado');
    const computedTotal = activeForMetrics.reduce((sum, d) => sum + Number(d.quantity_tm || 0), 0);

    exportDispatchesToPDF(
      dataToExport,
      startD,
      endD,
      computedTotal,
      filtersObj
    );

    setShowExportModal(false);
  };

  // ----------------------------------------------------
  // ANÁLISIS DE DATOS PARA ESTADÍSTICAS Y GRÁFICOS SVG
  // ----------------------------------------------------
  // Filtrar anulados para no tomarlos en cuenta en métricas ni gráficos
  const activeForMetrics = filteredDispatches.filter(d => d.status !== 'Anulado');

  const totalQuantity = activeForMetrics.reduce((sum, d) => Math.round((sum + d.quantity_tm) * 1000) / 1000, 0);
  const avgQuantity = activeForMetrics.length > 0 ? totalQuantity / activeForMetrics.length : 0;
  const activeDispatches = activeForMetrics.filter(d => d.status !== 'Entregado').length;

  // 1. Datos para Donut Chart (Distribución por Tipo de Producto)
  const productDistribution = activeForMetrics.reduce((acc, d) => {
    acc[d.product_type] = Math.round(((acc[d.product_type] || 0) + d.quantity_tm) * 1000) / 1000;
    return acc;
  }, {});

  const distributionArray = Object.keys(productDistribution).map(key => ({
    name: key,
    value: productDistribution[key]
  })).sort((a, b) => b.value - a.value);

  // 2. Datos para Bar Chart (Despacho en TM por Fecha)
  // Agrupar despachos por fecha, ordenados cronológicamente
  const dispatchesByDate = activeForMetrics.reduce((acc, d) => {
    const dateKey = d.dispatch_datetime.split('T')[0];
    acc[dateKey] = Math.round(((acc[dateKey] || 0) + d.quantity_tm) * 1000) / 1000;
    return acc;
  }, {});

  const chartData = Object.keys(dispatchesByDate).map(key => ({
    date: key,
    tm: dispatchesByDate[key]
  })).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7); // Mostrar últimos 7 días con despachos

  // 3. Datos para Top Clientes (Volumen en TM)
  const clientDistribution = activeForMetrics.reduce((acc, d) => {
    acc[d.client_name] = Math.round(((acc[d.client_name] || 0) + d.quantity_tm) * 1000) / 1000;
    return acc;
  }, {});
  const topClientsArray = Object.keys(clientDistribution).map(key => ({
    name: key,
    value: Number(clientDistribution[key].toFixed(2))
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  // 4. Datos para Top Destinos (Volumen en TM)
  const destinationDistribution = activeForMetrics.reduce((acc, d) => {
    if (!d.destination_state) return acc;
    acc[d.destination_state] = Math.round(((acc[d.destination_state] || 0) + d.quantity_tm) * 1000) / 1000;
    return acc;
  }, {});
  const topDestinationsArray = Object.keys(destinationDistribution).map(key => ({
    name: key,
    value: Number(destinationDistribution[key].toFixed(2))
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  // Colores para tipos de producto
  const productColors = {
    'Tripolifosfato': '#6366f1',
    'Ácido Fosfórico': '#f59e0b',
    'Pirofosfato': '#10b981',
    'Otros': '#ec4899'
  };

  return (
    <div style={{ padding: '24px', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
              <Truck size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Despachos y Ventas</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Registra y audita la salida de productos en Toneladas Métricas (TM) y visualiza las analíticas de ventas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link 
            to="/product-types"
            style={{
              background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)',
              color: '#818cf8', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer',
              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(129, 140, 248, 0.05)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.03)'}
          >
            <Layers size={18} /> Tipos de Producto
          </Link>
          <button 
            onClick={() => {
              setShowExportModal(true);
              setExportModalType('current');
              setPdfStartDate(startDate || '');
              setPdfEndDate(endDate || '');
              setPdfProductType(productTypeFilter);
              setPdfClient(clientFilter);
              setPdfStatus(statusFilter);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)',
              color: '#3b82f6', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer',
              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(59, 130, 246, 0.08)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.03)'}
          >
            <FileText size={18} /> Exportar a PDF
          </button>
          <button 
            onClick={() => navigate('/dispatches/new')}
            style={{
              background: 'var(--accent-gradient)', border: 'none', color: 'white',
              padding: '10px 18px', borderRadius: '12px', cursor: 'pointer',
              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)'
            }}
          >
            <Plus size={18} /> Nuevo Despacho
          </button>
        </div>
      </div>

      {/* ERROR STATUS INDICATOR */}
      {error && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.85rem',
          color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <ShieldAlert size={16} /> <span>{error}</span>
        </div>
      )}

      {/* SECCIÓN DE FILTROS PRINCIPAL (COMPACTA Y DE PRIMERO) */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', background: 'rgba(15, 23, 42, 0.3)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Búsqueda libre */}
          <div style={{ flex: 2, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Buscar por cliente, destino, orden..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 36px', borderRadius: '10px',
                background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Filtro Producto */}
          <div style={{ flex: 1, minWidth: '150px' }}>
            <select
              value={productTypeFilter}
              onChange={e => setProductTypeFilter(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '10px',
                background: 'var(--bg-primary)',
                border: `1px solid ${productTypeFilter !== 'Todos' ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'}`,
                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
              }}
            >
              <option value="Todos">Todos los Productos</option>
              {productTypesList.map(pt => (
                <option key={pt.id} value={pt.name}>{pt.name}</option>
              ))}
              {productTypesList.length === 0 && (
                <>
                  <option value="Tripolifosfato">Tripolifosfato</option>
                  <option value="Ácido Fosfórico">Ácido Fosfórico</option>
                  <option value="Pirofosfato">Pirofosfato</option>
                  <option value="Otros">Otros</option>
                </>
              )}
            </select>
          </div>


          {/* Rangos de Fecha */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Desde</span>
            <input 
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{
                padding: '7px 10px', borderRadius: '10px',
                background: 'var(--bg-primary)',
                border: `1px solid ${startDate ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'}`,
                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.8rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hasta</span>
            <input 
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{
                padding: '7px 10px', borderRadius: '10px',
                background: 'var(--bg-primary)',
                border: `1px solid ${endDate ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'}`,
                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.8rem'
              }}
            />
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Toggle filtros avanzados */}
          <button
            onClick={() => setShowAdvancedFilters(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.8rem', transition: 'all 0.2s',
              border: `1px solid ${showAdvancedFilters ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'}`,
              background: showAdvancedFilters ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
              color: showAdvancedFilters ? '#818cf8' : 'var(--text-secondary)'
            }}
          >
            <Filter size={14} />
            {showAdvancedFilters ? 'Ocultar filtros' : 'Más filtros'}
            {[clientFilter !== 'Todos', destinationFilter !== 'Todos', statusFilter !== 'Todos'].filter(Boolean).length > 0 && (
              <span style={{
                background: '#6366f1', color: 'white', borderRadius: '50%',
                width: '16px', height: '16px', fontSize: '0.65rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700'
              }}>
                {[clientFilter !== 'Todos', destinationFilter !== 'Todos', statusFilter !== 'Todos'].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Botón Limpiar */}
          {(startDate || endDate || searchQuery || productTypeFilter !== 'Todos' || clientFilter !== 'Todos' || destinationFilter !== 'Todos' || statusFilter !== 'Todos') && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearchQuery('');
                setProductTypeFilter('Todos');
                setClientFilter('Todos');
                setDestinationFilter('Todos');
                setStatusFilter('Todos');
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
                fontWeight: '600', fontSize: '0.8rem', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* FILA AVANZADA: cliente + destino + estado (colapsable) */}
        {showAdvancedFilters && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
            marginTop: '12px', paddingTop: '12px',
            borderTop: '1px solid var(--glass-border)'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Filter size={12} /> Filtros adicionales:
            </span>

            {/* Filtro Cliente */}
            <div style={{ flex: 1, minWidth: '150px' }}>
              <select
                value={clientFilter}
                onChange={e => setClientFilter(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: `1px solid ${clientFilter !== 'Todos' ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'}`,
                  color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
                }}
              >
                <option value="Todos">Todos los Clientes</option>
                {uniqueClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>

            {/* Filtro Destino */}
            <div style={{ flex: 1, minWidth: '150px' }}>
              <select
                value={destinationFilter}
                onChange={e => setDestinationFilter(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: `1px solid ${destinationFilter !== 'Todos' ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'}`,
                  color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
                }}
              >
                <option value="Todos">Todos los Destinos</option>
                {uniqueDestinations.map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>

            {/* Filtro Estado */}
            <div style={{ flex: 1, minWidth: '130px' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: `1px solid ${statusFilter !== 'Todos' ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'}`,
                  color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
                }}
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Despachado">Despachado</option>
                <option value="En Ruta">En Ruta</option>
                <option value="Entregado">Entregado</option>
                <option value="Anulado">Anulado</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* METRICS SUMMARY STRIP (ULTRA COMPACT RIBBON) */}
      <div className="card" style={{ 
        padding: '10px 20px', 
        marginBottom: '20px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px dashed rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={14} color="#818cf8" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Despachos Totales:</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white' }}>{filteredDispatches.length}</span>
        </div>

        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={14} color="#34d399" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Volumen Total:</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white' }}>{totalQuantity.toFixed(2)} <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 'normal' }}>tm</span></span>
        </div>

        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={14} color="#f43f5e" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Promedio Viaje:</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white' }}>{avgQuantity.toFixed(2)} <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 'normal' }}>tm</span></span>
        </div>

        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={14} color="#fbbf24" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pendientes/En Ruta:</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white' }}>{activeDispatches}</span>
        </div>
      </div>

      {/* SECCIÓN DE ENLACE A ANALÍTICAS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>Métricas Analíticas</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(Calculadas en tiempo real)</span>
        </div>
        <button 
          onClick={() => navigate('/reports')}
          style={{
            background: 'var(--accent-gradient)', border: 'none',
            color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
          }}
        >
          <TrendingUp size={16} />
          Ver Analíticas Detalladas
        </button>
      </div>

      {/* DISPATCHES DATA TABLE */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlignment: 'center', color: 'var(--text-secondary)' }}>
            Cargando despachos...
          </div>
        ) : filteredDispatches.length === 0 ? (
          <div style={{ padding: '60px', textAlignment: 'center', color: 'var(--text-secondary)' }}>
            No se encontraron registros de despachos que coincidan con los filtros aplicados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', minHeight: '300px' }}>
            <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Cliente</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Producto</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Cant (TM)</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Destino</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Fecha</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Estatus</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                 {currentDispatches.map(d => {
                  const isAnulado = d.status === 'Anulado';
                  const createdLocalStr = d.createdAt ? d.createdAt.replace(' ', 'T') : null;
                  const createdDate = createdLocalStr ? new Date(createdLocalStr) : new Date(d.dispatch_datetime);
                  const diffMins = (new Date() - createdDate) / 1000 / 60;
                  const isPast20Mins = diffMins > 20;

                  return (
                    <tr 
                      key={d.id} 
                      onContextMenu={(e) => handleContextMenu(e, d)}
                      style={{ 
                        borderBottom: '1px solid var(--glass-border)', 
                        opacity: isAnulado ? 0.45 : 1,
                        background: isAnulado ? 'rgba(239, 68, 68, 0.02)' : 'transparent',
                        cursor: isAnulado ? 'default' : 'context-menu'
                      }} 
                    >
                      <td style={{ padding: '16px 20px', fontWeight: '600', fontSize: '0.9rem', textDecoration: isAnulado ? 'line-through' : 'none' }}>
                        {d.client_name}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.875rem', fontWeight: '500', textDecoration: isAnulado ? 'line-through' : 'none' }}>
                        {d.product_type}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '600', textDecoration: isAnulado ? 'line-through' : 'none' }}>
                        {Number(d.quantity_tm).toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>tm</span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: isAnulado ? 'line-through' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} color="#f43f5e" /> {d.destination_state}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.875rem', textDecoration: isAnulado ? 'line-through' : 'none' }}>{d.dispatch_datetime.replace('T', ' ')}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '6px 12px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '600',
                          background: d.status === 'Entregado' ? 'rgba(16,185,129,0.1)' : d.status === 'En Ruta' ? 'rgba(245,158,11,0.1)' : d.status === 'Anulado' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                          color: d.status === 'Entregado' ? '#34d399' : d.status === 'En Ruta' ? '#fbbf24' : d.status === 'Anulado' ? '#f87171' : '#818cf8',
                          border: `1px solid ${d.status === 'Entregado' ? 'rgba(16,185,129,0.2)' : d.status === 'En Ruta' ? 'rgba(245,158,11,0.2)' : d.status === 'Anulado' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'}`
                        }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-block', position: 'relative' }}>
                          <button 
                            className={`action-btn ${activeDropdownId === d.id ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === d.id ? null : d.id); setStatusMenuPos(null); }}
                            title="Opciones"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {activeDropdownId === d.id && (
                            <div className="dropdown-popup" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="dropdown-item"
                                onClick={() => { setActiveDropdownId(null); setSelectedDispatchDetails(d); }}
                              >
                                <Eye size={16} color="#38bdf8" /> <span>Ver Detalles</span>
                              </button>

                              {!isAnulado && (
                                <>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => { setActiveDropdownId(null); navigate('/dispatches/edit/' + d.id); }}
                                  >
                                    <Edit2 size={16} color="#818cf8" /> <span>Editar</span>
                                  </button>

                                  <button
                                    className="dropdown-item danger"
                                    onClick={() => { setActiveDropdownId(null); handleDelete(d); }}
                                    style={{ color: isPast20Mins ? '#fbbf24' : '#f87171' }}
                                  >
                                    {isPast20Mins ? <Ban size={16} /> : <Trash2 size={16} />} 
                                    <span>{isPast20Mins ? 'Anular orden' : 'Eliminar'}</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 24px', borderTop: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.01)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px'
          }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Mostrando <span style={{ color: 'white', fontWeight: '600' }}>{indexOfFirstItem + 1}</span> a <span style={{ color: 'white', fontWeight: '600' }}>{Math.min(indexOfLastItem, filteredDispatches.length)}</span> de <span style={{ color: 'white', fontWeight: '600' }}>{filteredDispatches.length}</span> despachos
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{
                  background: currentPage === 1 ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--glass-border)', color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'white',
                  width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    background: currentPage === page ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.03)',
                    border: currentPage === page ? 'none' : '1px solid var(--glass-border)',
                    color: 'white', fontWeight: '600', width: '36px', height: '36px', borderRadius: '10px',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{
                  background: currentPage === totalPages ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--glass-border)', color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'white',
                  width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL VER DETALLES */}
      {selectedDispatchDetails && (
        <div 
          onClick={() => setSelectedDispatchDetails(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
              borderRadius: '28px', padding: '36px', width: '700px', maxWidth: '100%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '16px', background: 'var(--accent-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' }}>
                  <FileText size={28} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: '700', letterSpacing: '1px' }}>Detalles de Despacho Logístico</span>
                  <h2 style={{ margin: 0, color: 'white', fontSize: '1.6rem', fontWeight: '800' }}>{selectedDispatchDetails.order_number}</h2>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDispatchDetails(null)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '10px', borderRadius: '12px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseOver={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              
              {/* Cliente */}
              <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <Building2 size={16} color="#38bdf8" /> CLIENTE
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{selectedDispatchDetails.client_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>RIF: {selectedDispatchDetails.client_rif || 'No registrado'}</div>
              </div>

              {/* Producto */}
              <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <Package size={16} color="#818cf8" /> PRODUCTO Y VOLUMEN
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{selectedDispatchDetails.product_type}</div>
                <div style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: '700' }}>{Number(selectedDispatchDetails.quantity_tm).toFixed(2)} TM</div>
              </div>

              {/* Destino y Fecha */}
              <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <MapPin size={16} color="#f43f5e" /> DESTINO Y FECHA
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{selectedDispatchDetails.destination_state}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedDispatchDetails.dispatch_datetime.replace('T', ' ')}</div>
              </div>

              {/* Transporte */}
              <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <Truck size={16} color="#fbbf24" /> INFORMACIÓN DE TRANSPORTE
                </div>
                {selectedDispatchDetails.driver_name ? (
                  <>
                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{selectedDispatchDetails.driver_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '600' }}>Placa: {selectedDispatchDetails.license_plate}</div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '6px' }}>Sin transporte asignado</div>
                )}
              </div>

              {/* Estatus y Registro */}
              <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)', gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>ESTATUS LOGÍSTICO</div>
                  <span style={{
                    padding: '8px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '700', display: 'inline-block',
                    background: selectedDispatchDetails.status === 'Entregado' ? 'rgba(16,185,129,0.15)' : selectedDispatchDetails.status === 'En Ruta' ? 'rgba(245,158,11,0.15)' : selectedDispatchDetails.status === 'Anulado' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                    color: selectedDispatchDetails.status === 'Entregado' ? '#34d399' : selectedDispatchDetails.status === 'En Ruta' ? '#fbbf24' : selectedDispatchDetails.status === 'Anulado' ? '#f87171' : '#818cf8',
                    border: `1px solid ${selectedDispatchDetails.status === 'Entregado' ? 'rgba(16,185,129,0.3)' : selectedDispatchDetails.status === 'En Ruta' ? 'rgba(245,158,11,0.3)' : selectedDispatchDetails.status === 'Anulado' ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`
                  }}>
                    {selectedDispatchDetails.status}
                  </span>
                </div>
                {selectedDispatchDetails.createdAt && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>FECHA REGISTRO EN SISTEMA</div>
                    <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: '500' }}>{selectedDispatchDetails.createdAt}</div>
                  </div>
                )}
              </div>

            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setSelectedDispatchDetails(null)}
                style={{
                  background: 'var(--accent-gradient)', border: 'none', color: 'white',
                  padding: '12px 28px', borderRadius: '16px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
                }}
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPORTACIÓN AVANZADA PDF */}
      {showExportModal && (
        <div 
          onClick={() => setShowExportModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
              borderRadius: '28px', padding: '32px', width: '560px', maxWidth: '100%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--accent-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, color: 'white', fontSize: '1.3rem', fontWeight: '800' }}>Exportar Reporte PDF</h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Configura los filtros de auditoría para tu documento corporativo.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* PESTAÑAS DE MODO EXPORTACIÓN */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
              <button
                onClick={() => setExportModalType('current')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s',
                  background: exportModalType === 'current' ? 'var(--accent-gradient)' : 'transparent',
                  color: 'white'
                }}
              >
                Vista Actual ({filteredDispatches.length})
              </button>
              <button
                onClick={() => setExportModalType('custom')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s',
                  background: exportModalType === 'custom' ? 'var(--accent-gradient)' : 'transparent',
                  color: 'white'
                }}
              >
                Reporte Personalizado
              </button>
            </div>

            {exportModalType === 'current' ? (
              <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'white' }}>Resumen de Filtros Activos</h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Se exportará exactamente lo que ves actualmente en la tabla del sistema.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Rango de Fechas:</span>
                    <span style={{ color: 'white', fontWeight: '500' }}>{startDate || 'Inicio'} al {endDate || 'Hoy'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Producto:</span>
                    <span style={{ color: 'white', fontWeight: '500' }}>{productTypeFilter}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cliente:</span>
                    <span style={{ color: 'white', fontWeight: '500' }}>{clientFilter}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Estatus:</span>
                    <span style={{ color: 'white', fontWeight: '500' }}>{statusFilter}</span>
                  </div>
                  {searchQuery && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Búsqueda activa:</span>
                      <span style={{ color: 'white', fontWeight: '500' }}>"{searchQuery}"</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {/* Rango de Fechas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>DESDE</label>
                    <input 
                      type="date" 
                      value={pdfStartDate}
                      onChange={e => setPdfStartDate(e.target.value)}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '10px',
                        background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                        color: 'white', fontFamily: 'inherit', fontSize: '0.85rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>HASTA</label>
                    <input 
                      type="date" 
                      value={pdfEndDate}
                      onChange={e => setPdfEndDate(e.target.value)}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '10px',
                        background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                        color: 'white', fontFamily: 'inherit', fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>

                {/* Filtro Producto */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>LÍNEA DE PRODUCTO</label>
                  <select
                    value={pdfProductType}
                    onChange={e => setPdfProductType(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '10px',
                      background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                      color: 'white', fontFamily: 'inherit', fontSize: '0.85rem'
                    }}
                  >
                    <option value="Todos">Todos los Productos</option>
                    {productTypesList.map(pt => (
                      <option key={pt.id} value={pt.name}>{pt.name}</option>
                    ))}
                    {productTypesList.length === 0 && (
                      <>
                        <option value="Tripolifosfato">Tripolifosfato</option>
                        <option value="Ácido Fosfórico">Ácido Fosfórico</option>
                        <option value="Pirofosfato">Pirofosfato</option>
                        <option value="Otros">Otros</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Filtro Cliente */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>CLIENTE CORPORATIVO</label>
                  <select
                    value={pdfClient}
                    onChange={e => setPdfClient(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '10px',
                      background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                      color: 'white', fontFamily: 'inherit', fontSize: '0.85rem'
                    }}
                  >
                    <option value="Todos">Todos los Clientes</option>
                    {uniqueClients.map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Estatus */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>ESTATUS DE DESPACHO</label>
                  <select
                    value={pdfStatus}
                    onChange={e => setPdfStatus(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '10px',
                      background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                      color: 'white', fontFamily: 'inherit', fontSize: '0.85rem'
                    }}
                  >
                    <option value="Todos">Todos los Estados</option>
                    <option value="Despachado">Despachado</option>
                    <option value="En Ruta">En Ruta</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Anulado">Anulado</option>
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)',
                  padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleExecutePDFExport}
                style={{
                  background: 'var(--accent-gradient)', border: 'none', color: 'white',
                  padding: '10px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Download size={16} /> Generar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENÚ CONTEXTUAL (CLIC DERECHO) CAMBIO RÁPIDO DE ESTATUS */}
      {statusMenuPos && statusMenuDispatch && (
        <div 
          className="context-menu"
          onClick={(e) => e.stopPropagation()}
          style={{ top: Math.min(statusMenuPos.y, window.innerHeight - 200), left: Math.min(statusMenuPos.x, window.innerWidth - 230) }}
        >
          <div className="context-menu-title">Cambiar Estatus Rápido</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'Despachado', bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
              { label: 'En Ruta', bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
              { label: 'Entregado', bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
              { label: 'Anulado', bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'rgba(239,68,68,0.3)' }
            ].map(st => (
              <button
                key={st.label}
                className="dropdown-item"
                onClick={() => handleUpdateStatus(statusMenuDispatch.id, st.label)}
                style={{
                  background: statusMenuDispatch.status === st.label ? st.bg : 'transparent',
                  border: statusMenuDispatch.status === st.label ? `1px solid ${st.border}` : 'none',
                  color: st.color
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: st.color, display: 'inline-block' }} />
                <span>{st.label}</span>
                {statusMenuDispatch.status === st.label && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>(Actual)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dispatches;
