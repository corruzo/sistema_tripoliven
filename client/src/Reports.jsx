import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL } from './config';
import { exportDispatchesToPDF } from './utils/pdfExport';
import {
  Calendar, FileText, Download, Search, Filter, Layers,
  Users, TrendingUp, MapPin, Award, Clock, Package,
  ChevronDown, X, RefreshCw, AlertCircle, BarChart2,
  PieChart, Activity, ChevronLeft, ChevronRight
} from 'lucide-react';

// ─── Utilidades de Fecha ────────────────────────────────────────────────────

const getMonthRange = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const [date, time] = iso.split('T');
  return time ? `${date} ${time.substring(0, 5)}` : date;
};

// ─── Sub-componentes ─────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const styles = {
    Entregado: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
    'En Ruta': { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    Anulado: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
    Despachado: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  };
  const s = styles[status] || styles.Despachado;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600',
      display: 'inline-block', background: s.bg, color: s.color, border: `1px solid ${s.border}`
    }}>
      {status}
    </span>
  );
};

const KpiCard = ({ icon: Icon, label, value, sub, color, accent }) => (
  <div style={{
    background: 'rgba(15,23,42,0.4)', border: '1px solid var(--glass-border)',
    borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px',
    position: 'relative', overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
      background: `linear-gradient(90deg, ${color}60, transparent)`
    }} />
    <div style={{
      padding: '11px', borderRadius: '11px',
      background: `${color}18`, color, flexShrink: 0
    }}>
      <Icon size={22} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ margin: '2px 0 0 0', fontSize: '1.45rem', fontWeight: '700', color: 'white', lineHeight: 1.1 }}>
        {value}
        {sub && <span style={{ fontSize: '0.78rem', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '4px' }}>{sub}</span>}
      </p>
    </div>
  </div>
);

const FilterInput = ({ label, value, onChange, placeholder, listId, children, type = 'text' }) => (
  <div>
    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        list={listId}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 30px 9px 12px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
          color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem',
          boxSizing: 'border-box', transition: 'border-color 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
        onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
      />
      {value && (
        <button onClick={() => onChange('')} style={{
          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px'
        }}>
          <X size={13} />
        </button>
      )}
    </div>
    {children}
  </div>
);

// ─── Gráfico Donut ────────────────────────────────────────────────────────────

const DonutChart = ({ data, total }) => {
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#3b82f6'];
  let accumulated = 0;
  const circumference = 100;
  const segments = data.map((item, i) => {
    const pct = total > 0 ? (item.value / total) * 100 : 0;
    const offset = circumference - accumulated + 25;
    accumulated += pct;
    return { ...item, pct, offset, color: COLORS[i % COLORS.length] };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="160" height="160" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
          {segments.map(seg => (
            <circle key={seg.name} cx="18" cy="18" r="15.915" fill="none"
              stroke={seg.color} strokeWidth="3.5"
              strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
              strokeDashoffset={seg.offset}
              style={{ transition: 'all 0.4s ease' }}
            />
          ))}
          <text x="18" y="16.5" fill="white" fontSize="4.5" fontWeight="bold" textAnchor="middle">{total.toFixed(1)}</text>
          <text x="18" y="21" fill="rgba(255,255,255,0.4)" fontSize="2.1" textAnchor="middle">TM Total</text>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '200px' }}>
        {segments.map(seg => (
          <div key={seg.name} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: '9px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.83rem', fontWeight: '600', color: 'white' }}>{seg.name}</span>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <span style={{ color: 'white', fontWeight: '700' }}>{seg.pct.toFixed(1)}%</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>({seg.value.toFixed(2)} TM)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Gráfico de Barras Horizontales ──────────────────────────────────────────

const BarChart = ({ data, total, color = '#10b981', showRank = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {data.slice(0, 6).map((item, i) => {
      const pct = total > 0 ? (item.value / total) * 100 : 0;
      const isTop = i < 3 && showRank;
      return (
        <div key={item.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.83rem', fontWeight: '600', color: 'white' }}>
              {showRank
                ? isTop
                  ? <Award size={14} color="#f59e0b" />
                  : <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '14px' }}>{i + 1}.</span>
                : <MapPin size={13} color={color} />
              }
              <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color, flexShrink: 0, marginLeft: '8px' }}>
              {item.value.toFixed(2)} TM <span style={{ color: 'var(--text-secondary)', fontWeight: '400', fontSize: '0.72rem' }}>({pct.toFixed(1)}%)</span>
            </span>
          </div>
          <div style={{ height: '7px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%', borderRadius: '4px',
              background: isTop ? `linear-gradient(90deg, ${color}cc, ${color})` : color,
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      );
    })}
  </div>
);

// ─── Componente Principal ─────────────────────────────────────────────────────

const Reports = () => {
  const defaultRange = getMonthRange();

  // ── Estado de Fechas y Filtros ──────────────────────────────────────────────
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [filters, setFilters] = useState({
    productType: '', client: '', state: '', status: 'Todos', search: ''
  });

  // ── Estado de Datos ─────────────────────────────────────────────────────────
  const [dispatches, setDispatches] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [productTypesList, setProductTypesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Estado de UI ────────────────────────────────────────────────────────────
  const [activeChartTab, setActiveChartTab] = useState('products');
  const [currentPage, setCurrentPage] = useState(1);
  const [exportType, setExportType] = useState('general');
  const [showFilters, setShowFilters] = useState(true);
  const ITEMS_PER_PAGE = 8;

  // ── Carga de Catálogos ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/clients`),
          fetch(`${API_BASE_URL}/api/product-types`)
        ]);
        if (cRes.ok) setClientsList(await cRes.json());
        if (pRes.ok) setProductTypesList(await pRes.json());
      } catch (e) {
        console.error('Error cargando catálogos:', e);
      }
    };
    load();
  }, []);

  // ── Carga de Despachos ─────────────────────────────────────────────────────
  const fetchDispatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = [];
      if (startDate) params.push(`startDate=${startDate}T00:00:00`);
      if (endDate) params.push(`endDate=${endDate}T23:59:59`);
      const url = `${API_BASE_URL}/api/dispatches${params.length ? '?' + params.join('&') : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setDispatches(await res.json() || []);
    } catch {
      setError('No se pudo conectar con el servidor. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchDispatches(); }, [fetchDispatches]);
  useEffect(() => { setCurrentPage(1); }, [filters, startDate, endDate]);

  // ── Filtrado en Memoria ────────────────────────────────────────────────────
  const filteredDispatches = useMemo(() => {
    let r = [...dispatches];
    if (filters.productType) r = r.filter(d => d.product_type?.toLowerCase().includes(filters.productType.toLowerCase()));
    if (filters.client) r = r.filter(d => d.client_name?.toLowerCase().includes(filters.client.toLowerCase()));
    if (filters.state) r = r.filter(d => (d.destination_state || d.destination_location || '').toLowerCase().includes(filters.state.toLowerCase()));
    if (filters.status !== 'Todos') r = r.filter(d => d.status === filters.status);
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      r = r.filter(d =>
        d.client_name?.toLowerCase().includes(q) ||
        d.order_number?.toLowerCase().includes(q) ||
        d.destination_state?.toLowerCase().includes(q) ||
        d.driver_name?.toLowerCase().includes(q) ||
        d.license_plate?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [dispatches, filters]);

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const hasActiveFilters = filters.productType || filters.client || filters.state ||
    filters.status !== 'Todos' || filters.search;

  const resetFilters = () => {
    setFilters({ productType: '', client: '', state: '', status: 'Todos', search: '' });
    setStartDate(defaultRange.start);
    setEndDate(defaultRange.end);
  };

  // ── Métricas derivadas (excluyen Anulados) ─────────────────────────────────
  const active = useMemo(() => filteredDispatches.filter(d => d.status !== 'Anulado'), [filteredDispatches]);
  const totalTM = useMemo(() => Math.round(active.reduce((a, d) => a + Number(d.quantity_tm || 0), 0) * 1000) / 1000, [active]);
  const avgTM = useMemo(() => active.length ? Math.round(totalTM / active.length * 100) / 100 : 0, [active, totalTM]);
  const inTransit = useMemo(() => active.filter(d => d.status !== 'Entregado').length, [active]);

  // ── Datos para Gráficas ────────────────────────────────────────────────────
  const byProduct = useMemo(() => {
    const m = {};
    active.forEach(d => { const k = d.product_type || 'Otros'; m[k] = (m[k] || 0) + Number(d.quantity_tm || 0); });
    return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value * 1000) / 1000 })).sort((a, b) => b.value - a.value);
  }, [active]);

  const byState = useMemo(() => {
    const m = {};
    active.forEach(d => { const k = d.destination_state || 'Otro'; m[k] = (m[k] || 0) + Number(d.quantity_tm || 0); });
    return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value * 1000) / 1000 })).sort((a, b) => b.value - a.value);
  }, [active]);

  const byMonth = useMemo(() => {
    const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const m = {};
    active.forEach(d => {
      const dt = d.dispatch_datetime?.split('T')[0];
      if (!dt) return;
      const [y, mo] = dt.split('-');
      const key = dt.substring(0, 7);
      if (!m[key]) m[key] = { name: `${MONTHS[parseInt(mo) - 1]} ${y}`, value: 0 };
      m[key].value += Number(d.quantity_tm || 0);
    });
    return Object.entries(m)
      .map(([key, v]) => ({ ...v, key, value: Math.round(v.value * 1000) / 1000 }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [active]);

  const byClient = useMemo(() => {
    const m = {};
    active.forEach(d => { const k = d.client_name || 'Desconocido'; m[k] = (m[k] || 0) + Number(d.quantity_tm || 0); });
    return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value * 1000) / 1000 })).sort((a, b) => b.value - a.value);
  }, [active]);

  const destinationsList = useMemo(() => {
    const s = new Set(dispatches.map(d => d.destination_state || d.destination_location).filter(Boolean));
    return [...s].sort();
  }, [dispatches]);

  // ── Paginación ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredDispatches.length / ITEMS_PER_PAGE);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDispatches.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDispatches, currentPage]);

  // ── Exportación PDF ────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!filteredDispatches.length) {
      alert('No hay registros para exportar con los filtros actuales.');
      return;
    }
    exportDispatchesToPDF(filteredDispatches, startDate, endDate, totalTM, filters, exportType);
  };

  // ── Tabs del Gráfico ───────────────────────────────────────────────────────
  const chartTabs = [
    { id: 'products', label: 'Productos', icon: PieChart, data: byProduct },
    { id: 'states', label: 'Destinos', icon: MapPin, data: byState },
    { id: 'months', label: 'Mensual', icon: Activity, data: byMonth },
    { id: 'clients', label: 'Clientes', icon: Users, data: byClient },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', color: 'white', fontFamily: 'Outfit, sans-serif', maxWidth: '1320px', margin: '0 auto' }}>

      {/* ── ENCABEZADO ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
              <BarChart2 size={22} />
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: '700', margin: 0, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Reportes & Analítica
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', margin: 0 }}>
            {filteredDispatches.length} registros · {startDate || 'Sin inicio'} → {endDate || 'Sin fin'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={fetchDispatches} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)', borderRadius: '9px', padding: '7px 14px',
            fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <RefreshCw size={13} /> Actualizar
          </button>
          <span style={{
            fontSize: '0.73rem', background: 'rgba(16,185,129,0.12)', color: '#34d399',
            padding: '6px 12px', borderRadius: '8px', fontWeight: '700',
            border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            En Vivo
          </span>
        </div>
      </div>

      {/* ── ERROR ─────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
          fontSize: '0.83rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── PANEL DE FILTROS ───────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--glass-border)', borderRadius: '14px', overflow: 'hidden' }}>

        {/* Cabecera del panel */}
        <div
          onClick={() => setShowFilters(v => !v)}
          style={{
            padding: '14px 20px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.01)',
            borderBottom: showFilters ? '1px solid var(--glass-border)' : 'none'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
            <Filter size={15} color="var(--accent-primary)" /> Filtros
            {hasActiveFilters && (
              <span style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '0.7rem', padding: '2px 7px', borderRadius: '10px', fontWeight: '700' }}>
                Activos
              </span>
            )}
          </span>
          <ChevronDown size={16} color="var(--text-secondary)" style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>

        {showFilters && (
          <div style={{ padding: '18px 20px' }}>

            {/* Fila 1: Fechas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <FilterInput label="Desde" type="date" value={startDate} onChange={setStartDate} />
              <FilterInput label="Hasta" type="date" value={endDate} onChange={setEndDate} />

              {/* Acceso rápido de fechas */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acceso Rápido</label>
                <div style={{ display: 'flex', gap: '7px' }}>
                  <button onClick={() => { const r = getMonthRange(); setStartDate(r.start); setEndDate(r.end); }} style={{
                    flex: 1, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                    color: '#60a5fa', borderRadius: '8px', padding: '7px', fontSize: '0.78rem',
                    fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                  }}>
                    <Calendar size={11} /> Mes Actual
                  </button>
                  <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{
                    flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)', borderRadius: '8px', padding: '7px', fontSize: '0.78rem',
                    fontWeight: '600', cursor: 'pointer'
                  }}>
                    Todo el Historial
                  </button>
                </div>
              </div>
            </div>

            {/* Fila 2: Filtros de datos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

              <FilterInput label="Producto" value={filters.productType} onChange={v => setFilter('productType', v)}
                placeholder="Buscar producto..." listId="prod-list">
                <datalist id="prod-list">
                  {productTypesList.map(p => <option key={p.id} value={p.name} />)}
                </datalist>
              </FilterInput>

              <FilterInput label="Cliente" value={filters.client} onChange={v => setFilter('client', v)}
                placeholder="Buscar cliente..." listId="client-list">
                <datalist id="client-list">
                  {clientsList.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </FilterInput>

              <FilterInput label="Estado / Destino" value={filters.state} onChange={v => setFilter('state', v)}
                placeholder="Filtrar estado..." listId="state-list">
                <datalist id="state-list">
                  {destinationsList.map((s, i) => <option key={i} value={s} />)}
                </datalist>
              </FilterInput>

              {/* Estatus */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Estatus
                </label>
                <select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={{
                  width: '100%', padding: '9px 12px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                  color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem', cursor: 'pointer'
                }}>
                  <option value="Todos">Todos los Estatus</option>
                  <option value="Despachado">Despachado</option>
                  <option value="En Ruta">En Ruta</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Anulado">Anulado</option>
                </select>
              </div>

              {/* Búsqueda */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Búsqueda Rápida
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                  <input type="text" placeholder="Factura, conductor, placa..." value={filters.search}
                    onChange={e => setFilter('search', e.target.value)} style={{
                      width: '100%', padding: '9px 12px 9px 30px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                      color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box'
                    }} />
                </div>
              </div>

            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={resetFilters} style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: '600', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <X size={13} /> Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <KpiCard icon={TrendingUp} label="Toneladas Despachadas" value={totalTM.toFixed(2)} sub="TM" color="#3b82f6" />
        <KpiCard icon={Layers} label="Viajes Registrados" value={filteredDispatches.length} color="#10b981" />
        <KpiCard icon={Package} label="Promedio por Viaje" value={avgTM.toFixed(2)} sub="TM" color="#8b5cf6" />
        <KpiCard icon={Clock} label="En Tránsito / Pendientes" value={inTransit} color="#f59e0b" />
      </div>

      {/* ── GRÁFICAS ANALÍTICAS ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '22px', marginBottom: '20px', border: '1px solid var(--glass-border)', borderRadius: '14px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <TrendingUp size={16} color="var(--accent-primary)" /> Distribución Analítica
          </h3>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '11px', border: '1px solid var(--glass-border)' }}>
            {chartTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeChartTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveChartTab(tab.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 13px',
                  borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.79rem',
                  fontWeight: '600', transition: 'all 0.18s',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)'
                }}>
                  <Icon size={13} /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido del gráfico */}
        <div style={{ minHeight: '220px' }}>
          {loading ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Cargando datos...
            </div>
          ) : !filteredDispatches.length ? (
            <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
              <TrendingUp size={38} style={{ opacity: 0.2 }} />
              <span style={{ fontSize: '0.88rem' }}>Sin datos para el período seleccionado</span>
            </div>
          ) : (
            <>
              {activeChartTab === 'products' && <DonutChart data={byProduct} total={totalTM} />}
              {activeChartTab === 'states' && <BarChart data={byState} total={totalTM} color="#10b981" />}
              {activeChartTab === 'months' && <BarChart data={byMonth} total={totalTM} color="#6366f1" />}
              {activeChartTab === 'clients' && <BarChart data={byClient} total={totalTM} color="#3b82f6" showRank />}
            </>
          )}
        </div>
      </div>

      {/* ── EXPORTACIÓN PDF ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '18px 22px', marginBottom: '20px', borderRadius: '14px',
        background: 'rgba(99,102,241,0.04)', border: '1px dashed rgba(99,102,241,0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
            <Download size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'white' }}>Exportar PDF Corporativo</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Se exportarán exactamente los <strong style={{ color: 'white' }}>{filteredDispatches.length} registros</strong> visibles en pantalla.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={exportType} onChange={e => setExportType(e.target.value)} style={{
            padding: '8px 12px', borderRadius: '9px', background: 'var(--bg-primary)',
            border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit',
            outline: 'none', fontSize: '0.83rem', cursor: 'pointer'
          }}>
            <option value="general">Reporte General (con gráficos)</option>
            <option value="client">Detalle por Cliente</option>
            <option value="product">Detalle por Producto</option>
            <option value="geographic">Distribución Geográfica</option>
          </select>

          <button onClick={handleExport} style={{
            padding: '9px 20px', background: 'var(--accent-gradient)', border: 'none',
            borderRadius: '9px', color: 'white', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.83rem',
            boxShadow: '0 4px 14px rgba(99,102,241,0.28)'
          }}>
            <Download size={15} /> Generar PDF
          </button>
        </div>
      </div>

      {/* ── TABLA DE REGISTROS ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)', borderRadius: '14px' }}>

        {/* Cabecera tabla */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(255,255,255,0.01)', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '600' }}>
            Registros Filtrados
            <span style={{ marginLeft: '8px', color: 'var(--text-secondary)', fontWeight: '400' }}>
              ({filteredDispatches.length})
            </span>
          </h3>
          {filteredDispatches.length > 0 && (
            <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredDispatches.length)} de {filteredDispatches.length}
            </span>
          )}
        </div>

        {/* Body tabla */}
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando registros...</div>
        ) : !filteredDispatches.length ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No hay registros que coincidan con los filtros activos.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                  {['Orden / Factura', 'Cliente', 'Producto', 'Cantidad', 'Destino', 'Fecha Salida', 'Estatus'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', fontSize: '0.72rem', textTransform: 'uppercase',
                      color: 'var(--text-secondary)', fontWeight: '600', borderBottom: '1px solid var(--glass-border)',
                      textAlign: h === 'Cantidad' ? 'right' : 'left', whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map(d => {
                  const anulado = d.status === 'Anulado';
                  return (
                    <tr key={d.id} style={{
                      borderBottom: '1px solid var(--glass-border)', opacity: anulado ? 0.4 : 1,
                      transition: 'background 0.15s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '11px 16px', fontWeight: '700', fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                        {d.order_number || '—'}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '0.83rem' }}>{d.client_name}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{d.client_rif}</p>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '0.83rem' }}>{d.product_type}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: '700', fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                        {Number(d.quantity_tm).toFixed(2)} <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: '400' }}>TM</span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '0.83rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={11} color="#f43f5e" />
                          {d.destination_state}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(d.dispatch_datetime)}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <StatusBadge status={d.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{
            padding: '12px 20px', borderTop: '1px solid var(--glass-border)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
          }}>
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} style={{
              padding: '5px 10px', borderRadius: '7px', border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.02)', color: currentPage === 1 ? 'var(--text-secondary)' : 'white',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center'
            }}>
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
              return (
                <button key={pg} onClick={() => setCurrentPage(pg)} style={{
                  padding: '5px 10px', borderRadius: '7px', border: '1px solid var(--glass-border)',
                  minWidth: '32px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                  background: currentPage === pg ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.02)',
                  color: 'white'
                }}>{pg}</button>
              );
            })}

            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} style={{
              padding: '5px 10px', borderRadius: '7px', border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.02)', color: currentPage === totalPages ? 'var(--text-secondary)' : 'white',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center'
            }}>
              <ChevronRight size={15} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;