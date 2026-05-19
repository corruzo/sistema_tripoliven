import React, { useEffect, useState } from 'react';
import { Trash2, Edit, UserPlus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from './config';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    system_role: 'Usuario',
    status: 'Activo',
    department_id: '',
    position_id: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  const loadUsers = () => {
    fetch(`${API_BASE_URL}/api/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  };

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
    loadUsers();
    loadPositions();
    loadDepartments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario/empleado?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadUsers();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Error al intentar eliminar.');
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditId(user.id);
      setFormData({
        name: user.name,
        email: user.email,
        username: user.username || '',
        password: '', // En edición, se deja vacío a menos que se quiera cambiar
        system_role: user.system_role || 'Usuario',
        status: user.status || 'Activo',
        department_id: user.department_id || '',
        position_id: user.position_id || ''
      });
    } else {
      setEditId(null);
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        system_role: 'Usuario',
        status: 'Activo',
        department_id: '',
        position_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editId 
      ? `${API_BASE_URL}/api/users/${editId}` 
      : `${API_BASE_URL}/api/users`;
    const method = editId ? 'PUT' : 'POST';

    try {
      const payload = {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
        position_id: formData.position_id ? parseInt(formData.position_id, 10) : null
      };

      // Si estamos editando y el campo de contraseña está vacío, quitamos el atributo para no sobreescribirla en blanco
      if (editId && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        loadUsers();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Error al guardar.');
    }
  };

  // Filtrar los cargos del formulario según el departamento seleccionado
  const filteredPositionsForModal = formData.department_id
    ? positions.filter(p => p.department_id === parseInt(formData.department_id, 10))
    : [];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDept = selectedDeptFilter === '' || user.department_id === parseInt(selectedDeptFilter, 10);
    
    return matchesSearch && matchesDept;
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredUsers.length, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDeptFilter]);

  return (
    <div style={{ zIndex: 1, position: 'relative' }}>
      <div className="page-header">
        <h1>Usuarios y Empleados</h1>
        <p>Gestión del personal y sus cargos asignados</p>
      </div>

      <div className="table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo o usuario..." 
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
            <UserPlus size={18} /> Nuevo Usuario
          </button>
        </div>

        <table className="modern-table">
          <thead>
            <tr>
              <th>EMPLEADO / USUARIO</th>
              <th>CARGO</th>
              <th>DEPARTAMENTO</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        @{user.username || 'sin_usuario'} | {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {user.position_name || 'Sin cargo asignado'}
                  </span>
                </td>
                <td>
                  {user.department_name ? (
                    <span className="role-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                      {user.department_name}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>N/A</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge status-${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s'
                    }}
                    onClick={() => handleOpenModal(user)}
                    onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                      <Edit size={18} />
                    </button>
                    <button style={{
                      background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s'
                    }}
                    onClick={() => handleDelete(user.id)}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                  No se encontraron usuarios.
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
              Mostrando <span style={{ color: 'white', fontWeight: '600' }}>{indexOfFirstItem + 1}</span> a <span style={{ color: 'white', fontWeight: '600' }}>{Math.min(indexOfLastItem, filteredUsers.length)}</span> de <span style={{ color: 'white', fontWeight: '600' }}>{filteredUsers.length}</span> registros
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
            width: '480px', border: '1px solid var(--glass-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>{editId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nombre Completo</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Correo Electrónico</label>
                <input 
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                />
              </div>

              {/* Nuevos Campos: Usuario y Contraseña */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nombre de Usuario</label>
                  <input 
                    required
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Contraseña {editId && '(Opcional)'}
                  </label>
                  <input 
                    required={!editId}
                    type="password"
                    placeholder={editId ? "Dejar vacío para no cambiar" : ""}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Rol del Sistema</label>
                  <select 
                    value={formData.system_role}
                    onChange={e => setFormData({...formData, system_role: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                  >
                    <option value="Usuario">Usuario</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Superusuario">Superusuario</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Estado</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Selección del Departamento y Cargo con filtro dinámico */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Departamento</label>
                  <select 
                    value={formData.department_id}
                    onChange={e => setFormData({
                      ...formData,
                      department_id: e.target.value,
                      position_id: '' // Limpiar cargo al cambiar departamento
                    })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
                  >
                    <option value="">-- Sin departamento --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Cargo Asignado</label>
                  <select 
                    disabled={!formData.department_id}
                    value={formData.position_id}
                    onChange={e => setFormData({...formData, position_id: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit', opacity: formData.department_id ? 1 : 0.6 }}
                  >
                    <option value="">-- Sin cargo asignado --</option>
                    {filteredPositionsForModal.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
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

export default UsersTable;
