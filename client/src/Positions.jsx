import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from './config';

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', department_id: '', description: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  const loadPositions = () => {
    fetch(`${API_BASE_URL}/api/positions`)
      .then(res => res.json())
      .then(data => setPositions(data))
      .catch(err => console.error(err));
  };

  const loadDepartments = () => {
    fetch(`${API_BASE_URL}/api/departments`)
      .then(res => res.json())
      .then(data => setDepartments(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadPositions();
    loadDepartments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este cargo?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/positions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error}`);
      } else {
        loadPositions();
      }
    } catch (err) {
      alert('Error al intentar eliminar.');
    }
  };

  const handleOpenModal = (pos = null) => {
    if (pos) {
      setEditId(pos.id);
      setFormData({ name: pos.name, department_id: pos.department_id, description: pos.description });
    } else {
      setEditId(null);
      setFormData({ name: '', department_id: departments[0]?.id || '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.department_id) {
      alert('Debes seleccionar un departamento.');
      return;
    }
    
    const url = editId 
      ? `${API_BASE_URL}/api/positions/${editId}` 
      : `${API_BASE_URL}/api/positions`;
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        loadPositions();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Error al guardar.');
    }
  };

  const filteredPositions = positions.filter(pos => {
    const matchesName = pos.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter === '' || pos.department_id === parseInt(selectedDeptFilter);
    return matchesName && matchesDept;
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPositions = filteredPositions.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredPositions.length, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDeptFilter]);

  return (
    <div style={{ zIndex: 1, position: 'relative' }}>
      <div className="page-header">
        <h1>Cargos</h1>
        <p>Gestión de los puestos de trabajo por departamento</p>
      </div>

      <div className="table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
            <input 
              type="text" 
              placeholder="Buscar por cargo..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: '12px', background: 'var(--bg-primary)',
                border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit'
              }}
            />
            <select
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              style={{
                padding: '10px 16px', borderRadius: '12px', background: 'var(--bg-primary)',
                border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit'
              }}
            >
              <option value="">Todos los departamentos</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            style={{
              background: 'var(--accent-gradient)', border: 'none', color: 'white',
              padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center',
              gap: '8px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
            <Plus size={18} /> Nuevo Cargo
          </button>
        </div>

        <table className="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>CARGO</th>
              <th>DEPARTAMENTO</th>
              <th>DESCRIPCIÓN</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {currentPositions.map(pos => (
              <tr key={pos.id}>
                <td><span style={{ color: 'var(--text-secondary)' }}>#{pos.id}</span></td>
                <td><span style={{ fontWeight: 500 }}>{pos.name}</span></td>
                <td>
                  <span className="role-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    {pos.department_name}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{pos.description || 'Sin descripción'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s'
                    }}
                    onClick={() => handleOpenModal(pos)}
                    onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                      <Edit size={18} />
                    </button>
                    <button style={{
                      background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s'
                    }}
                    onClick={() => handleDelete(pos.id)}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPositions.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                  No se encontraron cargos.
                </td>
              </tr>
            )}
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
              Mostrando <span style={{ color: 'white', fontWeight: '600' }}>{indexOfFirstItem + 1}</span> a <span style={{ color: 'white', fontWeight: '600' }}>{Math.min(indexOfLastItem, filteredPositions.length)}</span> de <span style={{ color: 'white', fontWeight: '600' }}>{filteredPositions.length}</span> registros
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
              <h2 style={{ margin: 0 }}>{editId ? 'Editar Cargo' : 'Nuevo Cargo'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nombre del Cargo</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Departamento</label>
                <select 
                  required
                  value={formData.department_id}
                  onChange={e => setFormData({...formData, department_id: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                >
                  <option value="" disabled>Selecciona un departamento...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
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

export default Positions;
