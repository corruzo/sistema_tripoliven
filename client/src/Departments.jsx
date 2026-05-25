import React, { useEffect, useState } from 'react';
import { normalizeApiListResponse } from './utils/api';
import { Trash2, Edit, Plus, X, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { API_BASE_URL } from './config';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', manager_id: '' });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(departments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDepartments = departments.slice(indexOfFirstItem, indexOfLastItem);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [departments.length, totalPages]);

  const loadDepartments = () => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/departments`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`El servidor respondió con código ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setDepartments(normalizeApiListResponse(data));
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar departamentos:', err);
        setError('No se pudo establecer conexión con el servidor de TripoliERP. Mostrando registros locales de resguardo.');
        setLoading(false);
      });
  };

  const loadUsers = () => {
    fetch(`${API_BASE_URL}/api/users`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error en usuarios: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setUsers(normalizeApiListResponse(data)))
      .catch(err => console.error('Error al cargar personal para departamentos:', err));
  };

  useEffect(() => {
    loadDepartments();
    loadUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este departamento?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/departments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error}`);
      } else {
        loadDepartments();
      }
    } catch (err) {
      alert('Error al intentar eliminar.');
    }
  };

  const handleOpenModal = (dept = null) => {
    if (dept) {
      setEditId(dept.id);
      setFormData({ name: dept.name, description: dept.description, manager_id: dept.manager_id || '' });
    } else {
      setEditId(null);
      setFormData({ name: '', description: '', manager_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editId 
      ? `${API_BASE_URL}/api/departments/${editId}` 
      : `${API_BASE_URL}/api/departments`;
    const method = editId ? 'PUT' : 'POST';

    try {
      // Parse manager_id to integer or null to follow DB schema types (Best Practice)
      const parsedManagerId = formData.manager_id ? parseInt(formData.manager_id, 10) : null;
      const payload = { ...formData, manager_id: parsedManagerId };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        loadDepartments();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Error al guardar.');
    }
  };

  return (
    <div style={{ zIndex: 1, position: 'relative' }}>
      <div className="page-header">
        <h1>Departamentos</h1>
        <p>Gestión de las áreas de la organización</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Departamentos Registrados</h2>
          <button 
            onClick={() => handleOpenModal()}
            style={{
              background: 'var(--accent-gradient)', border: 'none', color: 'white',
              padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center',
              gap: '8px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
            <Plus size={18} /> Nuevo Depto
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '16px',
            padding: '16px 24px',
            marginBottom: '20px',
            color: '#fca5a5',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.05)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <ShieldAlert size={22} style={{ color: '#f87171', flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#ef4444', fontWeight: 600 }}>Alerta de Conexión:</strong> {error}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Cargando el registro de departamentos...
          </div>
        ) : (
          <>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NOMBRE</th>
                  <th>ENCARGADO LÍDER</th>
                  <th>DESCRIPCIÓN</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {currentDepartments.map(dept => (
                  <tr key={dept.id}>
                    <td><span style={{ color: 'var(--text-secondary)' }}>#{dept.id}</span></td>
                    <td><span style={{ fontWeight: 500 }}>{dept.name}</span></td>
                    <td>
                      {dept.manager_name ? (
                        <span style={{ color: 'var(--accent-primary)', fontWeight: '500' }}>{dept.manager_name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>Sin encargado</span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {dept.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Sin descripción</span>}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{
                          background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s'
                        }}
                        onClick={() => handleOpenModal(dept)}
                        onMouseOver={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                          <Edit size={18} />
                        </button>
                        <button style={{
                          background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s'
                        }}
                        onClick={() => handleDelete(dept.id)}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 24px', borderTop: '1px solid var(--glass-border)',
                background: 'rgba(255, 255, 255, 0.01)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px'
              }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Mostrando <span style={{ color: 'white', fontWeight: '600' }}>{indexOfFirstItem + 1}</span> a <span style={{ color: 'white', fontWeight: '600' }}>{Math.min(indexOfLastItem, departments.length)}</span> de <span style={{ color: 'white', fontWeight: '600' }}>{departments.length}</span> registros
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
          </>
        )}
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: 'var(--bg-secondary)', padding: '24px', borderRadius: '20px',
            width: '400px', border: '1px solid var(--glass-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>{editId ? 'Editar Depto' : 'Nuevo Depto'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nombre del Departamento</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                />
              </div>
              {editId ? (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Usuario Encargado / Líder (Opcional)</label>
                  <select 
                    value={formData.manager_id}
                    onChange={e => setFormData({...formData, manager_id: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                  >
                    <option value="">-- Sin encargado asignado --</option>
                    {users
                      .filter(u => u.department_id === editId)
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.position_name || 'Sin cargo'})</option>
                      ))
                    }
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    * Solo se muestran empleados pertenecientes a este departamento.
                  </p>
                </div>
              ) : (
                <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
                    Registra el departamento primero para poder asignarle empleados y posteriormente definir su Líder/Encargado.
                  </p>
                </div>
              )}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Descripción (Opcional)</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit', resize: 'none', height: '80px' }}
                />
              </div>
              <button type="submit" style={{
                width: '100%', background: 'var(--accent-gradient)', border: 'none', color: 'white',
                padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit'
              }}>
                {editId ? 'Guardar Cambios' : 'Registrar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
