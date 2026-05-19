import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';
import { ArrowLeft, TrendingUp, MapPin, Package, Users, Calendar, BarChart3, Award } from 'lucide-react';

export default function DispatchAnalytics() {
    const navigate = useNavigate();
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('states'); // 'states' | 'products' | 'months' | 'clients'

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/dispatches/analytics`);
                if (res.ok) {
                    const data = await res.json();
                    setAnalyticsData(data);
                } else {
                    setError('Error al cargar analíticas desde la caché del servidor');
                }
            } catch (err) {
                setError('Error de conexión con el backend');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div style={{ padding: '40px', color: 'var(--text-secondary)', textAlign: 'center' }}>Cargando analíticas desde caché...</div>;
    if (error) return <div style={{ padding: '40px', color: '#f87171', textAlign: 'center' }}>{error}</div>;
    if (!analyticsData) return <div style={{ padding: '40px', color: 'var(--text-secondary)', textAlign: 'center' }}>No hay información analítica disponible.</div>;

    const { totalQuantity, destinationsArray, productsArray, monthsArray, clientsArray, cachedAt } = analyticsData;

    const productColors = {
        'Tripolifosfato': '#3b82f6',
        'Ácido Fosfórico': '#10b981',
        'Pirofosfato': '#8b5cf6',
        'Otros': '#06b6d4'
    };

    const defaultColorPalette = ['#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#6366f1'];

    return (
        <div style={{ zIndex: 1, position: 'relative' }}>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button 
                    onClick={() => navigate('/dispatches')}
                    style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '10px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <TrendingUp size={24} color="var(--accent-primary)" />
                            Analítica de Despachos
                        </h1>
                        {cachedAt && (
                            <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                ⚡ Caché Activa ({new Date(cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                        )}
                    </div>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Auditoría visual corporativa e indicadores clave de rendimiento en tiempo real</p>
                </div>
            </div>

            {/* BARRA DE NAVEGACIÓN DE PESTAÑAS (TABS) */}
            <div style={{ 
                display: 'flex', gap: '12px', marginBottom: '36px', overflowX: 'auto', 
                padding: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                borderRadius: '20px', backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
                <button 
                    onClick={() => setActiveTab('states')} 
                    style={{ 
                        flex: 1, minWidth: '200px', borderRadius: '16px', cursor: 'pointer', padding: '14px 24px', 
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
                        fontSize: '0.95rem', fontWeight: '700', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: activeTab === 'states' ? 'var(--accent-gradient)' : 'transparent',
                        color: activeTab === 'states' ? '#ffffff' : 'var(--text-primary)',
                        boxShadow: activeTab === 'states' ? '0 8px 20px rgba(79, 70, 229, 0.35)' : 'none',
                        opacity: activeTab === 'states' ? 1 : 0.7
                    }}
                    onMouseOver={e => { if (activeTab !== 'states') e.currentTarget.style.opacity = 1; }}
                    onMouseOut={e => { if (activeTab !== 'states') e.currentTarget.style.opacity = 0.7; }}
                >
                    <MapPin size={20} style={{ color: activeTab === 'states' ? '#ffffff' : '#10b981' }} />
                    <span>Acumulado por Estado</span>
                </button>
                <button 
                    onClick={() => setActiveTab('products')} 
                    style={{ 
                        flex: 1, minWidth: '200px', borderRadius: '16px', cursor: 'pointer', padding: '14px 24px', 
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
                        fontSize: '0.95rem', fontWeight: '700', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: activeTab === 'products' ? 'var(--accent-gradient)' : 'transparent',
                        color: activeTab === 'products' ? '#ffffff' : 'var(--text-primary)',
                        boxShadow: activeTab === 'products' ? '0 8px 20px rgba(79, 70, 229, 0.35)' : 'none',
                        opacity: activeTab === 'products' ? 1 : 0.7
                    }}
                    onMouseOver={e => { if (activeTab !== 'products') e.currentTarget.style.opacity = 1; }}
                    onMouseOut={e => { if (activeTab !== 'products') e.currentTarget.style.opacity = 0.7; }}
                >
                    <Package size={20} style={{ color: activeTab === 'products' ? '#ffffff' : '#f59e0b' }} />
                    <span>Productos Más Vendidos</span>
                </button>
                <button 
                    onClick={() => setActiveTab('months')} 
                    style={{ 
                        flex: 1, minWidth: '200px', borderRadius: '16px', cursor: 'pointer', padding: '14px 24px', 
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
                        fontSize: '0.95rem', fontWeight: '700', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: activeTab === 'months' ? 'var(--accent-gradient)' : 'transparent',
                        color: activeTab === 'months' ? '#ffffff' : 'var(--text-primary)',
                        boxShadow: activeTab === 'months' ? '0 8px 20px rgba(79, 70, 229, 0.35)' : 'none',
                        opacity: activeTab === 'months' ? 1 : 0.7
                    }}
                    onMouseOver={e => { if (activeTab !== 'months') e.currentTarget.style.opacity = 1; }}
                    onMouseOut={e => { if (activeTab !== 'months') e.currentTarget.style.opacity = 0.7; }}
                >
                    <Calendar size={20} style={{ color: activeTab === 'months' ? '#ffffff' : '#4f46e5' }} />
                    <span>Ventas por Mes</span>
                </button>
                <button 
                    onClick={() => setActiveTab('clients')} 
                    style={{ 
                        flex: 1, minWidth: '200px', borderRadius: '16px', cursor: 'pointer', padding: '14px 24px', 
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
                        fontSize: '0.95rem', fontWeight: '700', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: activeTab === 'clients' ? 'var(--accent-gradient)' : 'transparent',
                        color: activeTab === 'clients' ? '#ffffff' : 'var(--text-primary)',
                        boxShadow: activeTab === 'clients' ? '0 8px 20px rgba(79, 70, 229, 0.35)' : 'none',
                        opacity: activeTab === 'clients' ? 1 : 0.7
                    }}
                    onMouseOver={e => { if (activeTab !== 'clients') e.currentTarget.style.opacity = 1; }}
                    onMouseOut={e => { if (activeTab !== 'clients') e.currentTarget.style.opacity = 0.7; }}
                >
                    <Users size={20} style={{ color: activeTab === 'clients' ? '#ffffff' : '#8b5cf6' }} />
                    <span>Top Clientes</span>
                </button>
            </div>

            {/* CONTENIDO 1: ESTADOS */}
            {activeTab === 'states' && (
                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '32px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MapPin size={22} color="#10b981" /> Distribución Geográfica (TM por Estado Destino)
                    </h3>
                    
                    {destinationsArray.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay datos geográficos para mostrar.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {destinationsArray.map((dest, idx) => {
                                const maxVal = Math.max(...destinationsArray.map(c => c.value), 1);
                                const percent = (dest.value / maxVal) * 100;
                                const totalPercent = totalQuantity > 0 ? ((dest.value / totalQuantity) * 100).toFixed(1) : 0;

                                return (
                                    <div key={dest.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', width: '24px' }}>{idx + 1}.</span> {dest.name}
                                            </span>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{totalPercent}% del total</span>
                                                <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.95rem' }}>{dest.value.toFixed(2)} tm</span>
                                            </div>
                                        </div>
                                        <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '7px', overflow: 'hidden' }}>
                                            <div 
                                                style={{ 
                                                    width: `${percent}%`, 
                                                    height: '100%', 
                                                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', 
                                                    borderRadius: '7px',
                                                    transition: 'width 0.5s ease-out'
                                                }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* CONTENIDO 2: PRODUCTOS */}
            {activeTab === 'products' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '28px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Package size={22} color="#f59e0b" /> Participación Global por Producto
                        </h3>
                        {productsArray.length === 0 ? (
                            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                Sin datos para distribuir
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '220px' }}>
                                <svg width="180" height="180" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                    {(() => {
                                        let accumulatedPercent = 0;
                                        return productsArray.map((item, idx) => {
                                            const percent = (item.value / totalQuantity) * 100;
                                            const strokeDasharray = `${percent} ${100 - percent}`;
                                            const strokeDashoffset = 100 - accumulatedPercent + 25; 
                                            accumulatedPercent += percent;
                                            const color = productColors[item.name] || defaultColorPalette[idx % defaultColorPalette.length];
                                            return (
                                                <circle 
                                                    key={item.name}
                                                    cx="18" cy="18" r="15.915" fill="none" 
                                                    stroke={color} 
                                                    strokeWidth="3.5" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} 
                                                />
                                            );
                                        });
                                    })()}
                                    <g transform="translate(18, 18)">
                                        <text x="0" y="-1" fill="white" fontSize="4.5" fontWeight="bold" textAnchor="middle">
                                            {totalQuantity.toFixed(2)}
                                        </text>
                                        <text x="0" y="4" fill="var(--text-secondary)" fontSize="2.5" textAnchor="middle">
                                            TM Totales
                                        </text>
                                    </g>
                                </svg>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {productsArray.map((item, idx) => {
                                        const percent = (item.value / totalQuantity) * 100;
                                        const color = productColors[item.name] || defaultColorPalette[idx % defaultColorPalette.length];
                                        return (
                                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: color }}></span>
                                                <div style={{ fontSize: '0.9rem' }}>
                                                    <span style={{ fontWeight: '600', color: 'white', display: 'block' }}>{item.name}</span>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                        {percent.toFixed(1)}% ({item.value.toFixed(2)} tm)
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '28px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <BarChart3 size={22} color="#3b82f6" /> Ranking de Volumen por Producto
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {productsArray.map((prod, idx) => {
                                const maxVal = Math.max(...productsArray.map(p => p.value), 1);
                                const percent = (prod.value / maxVal) * 100;
                                const color = productColors[prod.name] || defaultColorPalette[idx % defaultColorPalette.length];

                                return (
                                    <div key={prod.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ fontWeight: '600', color: 'white' }}>{idx + 1}. {prod.name}</span>
                                            <span style={{ color: color, fontWeight: '700' }}>{prod.value.toFixed(2)} tm</span>
                                        </div>
                                        <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.5s ease-out' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENIDO 3: MESES */}
            {activeTab === 'months' && (
                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '32px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={22} color="#4f46e5" /> Evolución de Ventas Mensuales (TM)
                    </h3>
                    
                    {monthsArray.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay datos mensuales para graficar.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                            {monthsArray.map((m) => {
                                const maxVal = Math.max(...monthsArray.map(x => x.value), 1);
                                const percent = (m.value / maxVal) * 100;
                                const totalPercent = totalQuantity > 0 ? ((m.value / totalQuantity) * 100).toFixed(1) : 0;

                                return (
                                    <div key={m.rawKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Calendar size={16} color="#818cf8" /> {m.name}
                                            </span>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{totalPercent}% del total anual</span>
                                                <span style={{ color: '#818cf8', fontWeight: '700', fontSize: '0.95rem' }}>{m.value.toFixed(2)} tm</span>
                                            </div>
                                        </div>
                                        <div style={{ width: '100%', height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                                            <div 
                                                style={{ 
                                                    width: `${percent}%`, 
                                                    height: '100%', 
                                                    background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', 
                                                    borderRadius: '8px',
                                                    transition: 'width 0.5s ease-out'
                                                }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* CONTENIDO 4: CLIENTES */}
            {activeTab === 'clients' && (
                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '32px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={22} color="#3b82f6" /> Top Clientes por Volumen de Despacho (TM)
                    </h3>
                    
                    {clientsArray.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay datos de clientes registrados.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {clientsArray.slice(0, 15).map((client, idx) => {
                                const maxVal = Math.max(...clientsArray.map(c => c.value), 1);
                                const percent = (client.value / maxVal) * 100;
                                const totalPercent = totalQuantity > 0 ? ((client.value / totalQuantity) * 100).toFixed(1) : 0;
                                const isTop3 = idx < 3;

                                return (
                                    <div key={client.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '12px', background: isTop3 ? 'rgba(59, 130, 246, 0.08)' : 'transparent', border: isTop3 ? '1px solid rgba(59, 130, 246, 0.2)' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'center' }}>
                                            <span style={{ fontWeight: isTop3 ? '700' : '600', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {isTop3 ? <Award size={18} color="#f59e0b" /> : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', width: '18px' }}>{idx + 1}.</span>}
                                                {client.name}
                                            </span>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{totalPercent}% del total</span>
                                                <span style={{ color: isTop3 ? '#3b82f6' : '#818cf8', fontWeight: '700', fontSize: '0.95rem' }}>{client.value.toFixed(2)} tm</span>
                                            </div>
                                        </div>
                                        <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div 
                                                style={{ 
                                                    width: `${percent}%`, 
                                                    height: '100%', 
                                                    background: isTop3 ? 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)' : 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)', 
                                                    borderRadius: '6px',
                                                    transition: 'width 0.5s ease-out'
                                                }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
