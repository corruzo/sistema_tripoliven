import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import { Search, Plus, Edit, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';

const VENEZUELA_STATES = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 
    'Delta Amacuro', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda', 
    'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia'
];

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name: '', rif: '', state: '', address: '', phone: '', contact_person: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.state.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [filteredClients.length, totalPages]);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/clients`);
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            }
        } catch (err) {
            setError('Error de conexión al cargar clientes.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (client = null) => {
        if (client) {
            setEditId(client.id);
            setFormData({
                name: client.name,
                rif: client.rif,
                state: client.state,
                address: client.address || '',
                phone: client.phone || '',
                contact_person: client.contact_person || '',
                email: client.email || ''
            });
        } else {
            setEditId(null);
            setFormData({ name: '', rif: '', state: '', address: '', phone: '', contact_person: '', email: '' });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = editId 
            ? `${API_BASE_URL}/api/clients/${editId}` 
            : `${API_BASE_URL}/api/clients`;
        const method = editId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                fetchClients();
                setShowModal(false);
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Error al guardar cliente.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este cliente? Solo se eliminará si no tiene despachos asociados.')) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) {
                alert(`Error: ${data.error}`);
            } else {
                fetchClients();
            }
        } catch (err) {
            alert('Error al intentar eliminar.');
        }
    };

    return (
        <div style={{ zIndex: 1, position: 'relative' }}>
            <div className="page-header">
                <h1>Directorio de Clientes</h1>
                <p>Gestión de información de los clientes corporativos</p>
            </div>

            <div className="table-container">
                <div className="table-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, flex: 1 }}>Clientes Registrados</h2>
                    <div style={{ position: 'relative', width: '250px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            style={{
                                width: '100%', padding: '8px 12px 8px 36px', borderRadius: '10px',
                                background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                                color: 'white', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem'
                            }}
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        style={{
                            background: 'var(--accent-gradient)', border: 'none', color: 'white',
                            padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center',
                            gap: '8px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }}
                    >
                        <Plus size={18} /> Nuevo Cliente
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando clientes...</div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>RAZÓN SOCIAL</th>
                                <th>RIF</th>
                                <th>ESTADO</th>
                                <th>CONTACTO</th>
                                <th>TELÉFONO</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentClients.map(client => (
                                <tr key={client.id}>
                                    <td><span style={{ fontWeight: 500, color: 'white' }}>{client.name}</span></td>
                                    <td><span style={{ color: 'var(--text-secondary)' }}>{client.rif}</span></td>
                                    <td>
                                        <span style={{ 
                                            background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', 
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600'
                                        }}>
                                            {client.state}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{client.contact_person || 'Sin registrar'}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{client.phone || 'Sin registrar'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button style={{
                                                background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s'
                                            }}
                                            onClick={() => handleOpenModal(client)}
                                            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                                                <Edit size={18} />
                                            </button>
                                            <button style={{
                                                background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s'
                                            }}
                                            onClick={() => handleDelete(client.id)}
                                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentClients.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                                        No se encontraron clientes registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {/* Pagination Bar */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px 24px', borderTop: '1px solid var(--glass-border)',
                        background: 'rgba(255, 255, 255, 0.01)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px'
                    }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            Mostrando <span style={{ color: 'white', fontWeight: '600' }}>{indexOfFirstItem + 1}</span> a <span style={{ color: 'white', fontWeight: '600' }}>{Math.min(indexOfLastItem, filteredClients.length)}</span> de <span style={{ color: 'white', fontWeight: '600' }}>{filteredClients.length}</span> registros
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

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{
                        background: 'var(--bg-secondary)', padding: '24px', borderRadius: '20px',
                        width: '600px', maxWidth: '90%', border: '1px solid var(--glass-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>{editId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Razón Social / Nombre *</label>
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                                />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>RIF *</label>
                                    <input 
                                        required
                                        value={formData.rif}
                                        onChange={e => setFormData({...formData, rif: e.target.value})}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Estado (Venezuela) *</label>
                                    <select 
                                        required
                                        value={formData.state}
                                        onChange={e => setFormData({...formData, state: e.target.value})}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                                    >
                                        <option value="">Seleccione Estado</option>
                                        {VENEZUELA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Ubicación Exacta (Opcional)</label>
                                <input 
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Teléfono de Contacto (Opcional)</label>
                                    <input 
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Correo de la Empresa (Opcional)</label>
                                    <input 
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Persona de Contacto (Opcional)</label>
                                <input 
                                    value={formData.contact_person}
                                    onChange={e => setFormData({...formData, contact_person: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                                />
                            </div>

                            <button type="submit" style={{
                                width: '100%', background: 'var(--accent-gradient)', border: 'none', color: 'white',
                                padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit'
                            }}>
                                {editId ? 'Guardar Cambios' : 'Registrar Cliente'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
