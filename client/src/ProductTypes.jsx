import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, ShieldAlert, ArrowLeft, ChevronLeft, ChevronRight, Package, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from './config';
import { normalizeApiListResponse } from './utils/api';

const ProductTypes = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Activo');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(productTypes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProductTypes = productTypes.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [productTypes.length, totalPages]);

  const loadProductTypes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types`);
      if (!res.ok) throw new Error('Error al obtener los tipos de producto.');
      const data = await res.json();
      setProductTypes(normalizeApiListResponse(data));
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor. Mostrando catálogo local de contingencia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductTypes();
  }, []);

  const handleOpenModal = (type = null) => {
    if (type) {
      setEditId(type.id);
      setName(type.name);
      setDescription(type.description || '');
      setStatus(type.status || 'Activo');
    } else {
      setEditId(null);
      setName('');
      setDescription('');
      setStatus('Activo');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      alert('El nombre del tipo de producto es obligatorio.');
      return;
    }

    const payload = { name: name.trim(), description: description.trim(), status };
    const url = editId 
      ? `${API_BASE_URL}/api/product-types/${editId}` 
      : `${API_BASE_URL}/api/product-types`;
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        setIsModalOpen(false);
        loadProductTypes();
      } else {
        alert(data.error || 'Error al guardar el tipo de producto.');
      }
    } catch (err) {
      console.error(err);
      alert('Error en la conexión con el servidor.');
    }
  };

  const handleToggleStatus = async (type) => {
    const newStatus = type.status === 'Inactivo' ? 'Activo' : 'Inactivo';
    const payload = { 
      name: type.name, 
      description: type.description || '', 
      status: newStatus 
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types/${type.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadProductTypes();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al cambiar el estado del tipo de producto.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al cambiar el estado.');
    }
  };

  const handleDelete = async (id, typeName) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el tipo de producto "${typeName}"? Las órdenes de despacho existentes mantendrán su clasificación, pero ya no aparecerá para nuevos registros.`)) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadProductTypes();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el servidor.');
    }
  };

  return (
    <div style={{ zIndex: 1, position: 'relative' }}>
      
      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link 
            to="/dispatches"
            style={{ 
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', 
              borderRadius: '12px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: '800' }}>
              <div style={{ padding: '10px', borderRadius: '14px', background: 'var(--accent-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 15px rgba(37, 99, 235, 0.3)' }}>
                <Layers size={24} />
              </div>
              Tipos de Producto
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              Configura y administra las categorías y líneas de químicos para los despachos logísticos.
            </p>
          </div>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          style={{
            background: 'var(--accent-gradient)', border: 'none', color: 'white',
            padding: '12px 24px', borderRadius: '14px', cursor: 'pointer',
            fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)', transition: 'all 0.3s'
          }}
        >
          <Plus size={20} /> Nuevo Tipo de Producto
        </button>
      </div>

      {/* STATUS DE ERROR */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '16px', padding: '16px 20px', marginBottom: '28px', fontSize: '0.9rem',
          color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600'
        }}>
          <ShieldAlert size={20} /> <span>{error}</span>
        </div>
      )}

      {/* TABLA DE PRODUCTOS */}
      <div className="table-container">
        <div className="table-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            <Package size={20} color="var(--accent-primary)" />
            Catálogo y Disponibilidad de Productos
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Cargando catálogo de productos...
          </div>
        ) : productTypes.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Package size={48} style={{ opacity: 0.3, margin: '0 auto 16px auto', display: 'block' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Sin Clasificaciones Registradas</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.95rem' }}>No hay tipos de producto en el sistema. Haz clic en "Nuevo Tipo de Producto" para crear tu primera categoría.</p>
          </div>
        ) : (
          <>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NOMBRE DE CLASIFICACIÓN</th>
                  <th>DESCRIPCIÓN / NOTAS DE USO</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {currentProductTypes.map(t => (
                  <tr key={t.id}>
                    <td><span style={{ color: 'var(--text-secondary)' }}>#{t.id}</span></td>
                    <td><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</span></td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {t.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Sin descripción específica registrada</span>}
                      </span>
                    </td>
                    <td>
                      <span 
                        className={`status-badge ${t.status === 'Inactivo' ? 'status-inactive' : 'status-active'}`}
                        style={{ cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s' }}
                        title="Haga clic para alternar el estado de disponibilidad"
                        onClick={() => handleToggleStatus(t)}
                      >
                        {t.status || 'Activo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{
                          background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s'
                        }}
                        onClick={() => handleOpenModal(t)}
                        onMouseOver={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                          <Edit2 size={16} />
                        </button>
                        <button style={{
                          background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s'
                        }}
                        onClick={() => handleDelete(t.id, t.name)}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* BARRA DE PAGINACIÓN */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
                padding: '20px 28px', borderTop: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.01)'
              }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Mostrando <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{indexOfFirstItem + 1}</span> a <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{Math.min(indexOfLastItem, productTypes.length)}</span> de <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{productTypes.length}</span> registros
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    style={{
                      background: currentPage === 1 ? 'transparent' : 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)', color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                      width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: currentPage === 1 ? 0.4 : 1
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        background: currentPage === page ? 'var(--accent-gradient)' : 'var(--glass-bg)',
                        border: currentPage === page ? 'none' : '1px solid var(--glass-border)',
                        color: currentPage === page ? '#ffffff' : 'var(--text-primary)', fontWeight: '700', 
                        width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: currentPage === page ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    style={{
                      background: currentPage === totalPages ? 'transparent' : 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)', color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                      width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: currentPage === totalPages ? 0.4 : 1
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* VENTANA MODAL CRUD */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '500px', padding: '36px', borderRadius: '24px',
            border: '1px solid var(--glass-border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', margin: 0 }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent-gradient)', color: 'white' }}>
                  <Layers size={22} />
                </div>
                {editId ? 'Editar Tipo de Producto' : 'Nuevo Tipo de Producto'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ 
                  background: 'transparent', border: 'none', color: 'var(--text-secondary)', 
                  cursor: 'pointer', transition: 'color 0.2s' 
                }}
                onMouseOver={e => e.currentTarget.style.color = 'white'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Nombre de Clasificación *</label>
                <input 
                  required
                  type="text"
                  placeholder="Ej. Ácido Fosfórico, Pirofosfato..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ 
                    width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', 
                    border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem',
                    outline: 'none', transition: 'border 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Descripción / Notas de Uso</label>
                <textarea 
                  rows="3"
                  placeholder="Explica qué compuestos o líneas de químico agrupa esta categoría..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ 
                    width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', 
                    border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', 
                    resize: 'vertical', outline: 'none', transition: 'border 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Estado de Disponibilidad</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{ 
                    width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', 
                    border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem',
                    outline: 'none', transition: 'border 0.2s', fontWeight: '700'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                >
                  <option value="Activo">Activo (Disponible para nuevos despachos)</option>
                  <option value="Inactivo">Inactivo (No seleccionable en nuevos despachos)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
                    padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = 0.8}
                  onMouseOut={e => e.currentTarget.style.opacity = 1}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{
                    background: 'var(--accent-gradient)', border: 'none', color: '#ffffff',
                    padding: '12px 28px', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)', transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = 0.9}
                  onMouseOut={e => e.currentTarget.style.opacity = 1}
                >
                  {editId ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductTypes;
