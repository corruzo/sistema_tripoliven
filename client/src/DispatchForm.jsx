import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Truck, Save, ArrowLeft, Plus, X, Search, CheckCircle2, Building2, User, Phone, MapPin } from 'lucide-react';
import { API_BASE_URL } from './config';
import { normalizeApiListResponse } from './utils/api';

const VENEZUELA_STATES = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 
    'Delta Amacuro', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda', 
    'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia'
];

const getLocalDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Cifrado y descifrado XOR + Base64 para el borrador del localStorage
const encryptDraft = (text) => {
    const key = 'TRIPOLIVEN_ERP_2026_SALT';
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(unescape(encodeURIComponent(result)));
};

const decryptDraft = (encoded) => {
    try {
        const key = 'TRIPOLIVEN_ERP_2026_SALT';
        const text = decodeURIComponent(escape(atob(encoded)));
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    } catch (e) {
        return null;
    }
};

export default function DispatchForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    
    const [productTypes, setProductTypes] = useState([]);
    const [clients, setClients] = useState([]);
    
    // Autocomplete state
    const [clientSearch, setClientSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedClientObj, setSelectedClientObj] = useState(null);
    const searchRef = useRef(null);

    // Sugerencias de chofer y placa
    const [historicalSuggestions, setHistoricalSuggestions] = useState({ drivers: [], plates: [] });
    const [driverSuggestions, setDriverSuggestions] = useState([]);
    const [plateSuggestions, setPlateSuggestions] = useState([]);
    const [showDriverSuggestions, setShowDriverSuggestions] = useState(false);
    const [showPlateSuggestions, setShowPlateSuggestions] = useState(false);
    const driverRef = useRef(null);
    const plateRef = useRef(null);

    const [formData, setFormData] = useState({
        client_id: '',
        product_type: '',
        quantity_tm: '',
        destination_state: '',
        dispatch_datetime: '',
        order_number: '',
        driver_name: '',
        license_plate: '',
        status: 'Despachado'
    });

    const [showClientModal, setShowClientModal] = useState(false);
    const [clientForm, setClientForm] = useState({ name: '', rif: '', state: '', address: '', phone: '', contact_person: '', email: '' });

    const [savedDraftData, setSavedDraftData] = useState(null);
    const [showDraftBanner, setShowDraftBanner] = useState(false);
    const [draftSavedTime, setDraftSavedTime] = useState(null);
    const isRestoringRef = useRef(false);

    const [orderNumberError, setOrderNumberError] = useState('');
    const [checkingOrderNumber, setCheckingOrderNumber] = useState(false);

    const loadSuggestions = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/dispatches/suggestions`);
            if (res.ok) {
                const data = await res.json();
                setHistoricalSuggestions(data || { drivers: [], plates: [] });
            }
        } catch (err) {
            console.error('Error al cargar sugerencias históricas:', err);
        }
    };

    useEffect(() => {
        const init = async () => {
            if (isEdit) {
                const currentProduct = await loadDispatch();
                await Promise.all([loadProductTypes(currentProduct), loadClients()]);
            } else {
                await Promise.all([loadProductTypes(), loadClients()]);
                await generateDefaults();
                await loadSuggestions(); // Cargar sugerencias
                
                // Check borrador al iniciar un nuevo despacho (Descifrado seguro)
                const encryptedDraft = localStorage.getItem('tripoliven_dispatch_draft');
                if (encryptedDraft) {
                    try {
                        const decrypted = decryptDraft(encryptedDraft);
                        if (decrypted) {
                            const draft = JSON.parse(decrypted);
                            if (draft && draft.formData && (draft.formData.client_id || draft.formData.quantity_tm || draft.formData.driver_name || draft.formData.license_plate || draft.formData.order_number)) {
                                setSavedDraftData(draft);
                                setShowDraftBanner(true);
                            }
                        }
                    } catch(e) {}
                }
            }
        };
        init();

        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
            if (driverRef.current && !driverRef.current.contains(e.target)) {
                setShowDriverSuggestions(false);
            }
            if (plateRef.current && !plateRef.current.contains(e.target)) {
                setShowPlateSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isEdit, id]);

    // Guardado automático cifrado en localStorage al realizar cambios en un formulario nuevo
    useEffect(() => {
        if (!isEdit && !loading && !isRestoringRef.current) {
            if (formData.client_id || formData.quantity_tm || formData.driver_name || formData.license_plate || formData.order_number) {
                const draftObj = {
                    formData: {
                        client_id: formData.client_id,
                        product_type: formData.product_type,
                        quantity_tm: formData.quantity_tm,
                        destination_state: formData.destination_state,
                        order_number: formData.order_number,
                        driver_name: formData.driver_name,
                        license_plate: formData.license_plate,
                        status: formData.status
                    },
                    clientSearch,
                    selectedClientObj,
                    savedAt: new Date().toISOString()
                };
                const encrypted = encryptDraft(JSON.stringify(draftObj));
                localStorage.setItem('tripoliven_dispatch_draft', encrypted);
                setDraftSavedTime(new Date());
            }
        }
    }, [formData, clientSearch, selectedClientObj, isEdit, loading]);

    // Relacionar cliente seleccionado con el searchBar si se carga un dispatch para editar
    useEffect(() => {
        if (formData.client_id && clients.length > 0) {
            const c = clients.find(cl => cl.id.toString() === formData.client_id.toString());
            if (c && !selectedClientObj) {
                setSelectedClientObj(c);
                setClientSearch(c.name);
            }
        }
    }, [formData.client_id, clients, selectedClientObj]);

    const handleRestoreDraft = () => {
        if (savedDraftData) {
            isRestoringRef.current = true;
            setFormData(prev => ({
                ...prev,
                client_id: savedDraftData.formData.client_id || '',
                product_type: savedDraftData.formData.product_type || prev.product_type,
                quantity_tm: savedDraftData.formData.quantity_tm || '',
                destination_state: savedDraftData.formData.destination_state || prev.destination_state,
                order_number: savedDraftData.formData.order_number || prev.order_number,
                driver_name: savedDraftData.formData.driver_name || '',
                license_plate: savedDraftData.formData.license_plate || '',
                status: savedDraftData.formData.status || 'Despachado'
            }));
            if (savedDraftData.clientSearch) {
                setClientSearch(savedDraftData.clientSearch);
            }
            if (savedDraftData.selectedClientObj) {
                setSelectedClientObj(savedDraftData.selectedClientObj);
            }
            setShowDraftBanner(false);
            setTimeout(() => { isRestoringRef.current = false; }, 500);
        }
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem('tripoliven_dispatch_draft');
        setShowDraftBanner(false);
        setSavedDraftData(null);
    };

    const loadProductTypes = async (currentProductType) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/product-types`);
            if (res.ok) {
                const data = await res.json();
                const types = normalizeApiListResponse(data);
                const filtered = types.filter(pt => pt.status !== 'Inactivo' || pt.name === currentProductType);
                setProductTypes(filtered);
                if (!isEdit && filtered.length > 0 && !formData.product_type) {
                    setFormData(prev => ({ ...prev, product_type: filtered[0].name }));
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadClients = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/clients`);
            if (res.ok) {
                const data = await res.json();
                setClients(normalizeApiListResponse(data));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadDispatch = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/dispatches/${id}`);
            if (res.ok) {
                const d = await res.json();
                if (d && d.id) {
                    setFormData({
                        client_id: d.client_id || '',
                        product_type: d.product_type,
                        quantity_tm: d.quantity_tm.toString(),
                        destination_state: d.destination_state,
                        dispatch_datetime: d.dispatch_datetime,
                        order_number: d.order_number,
                        driver_name: d.driver_name || '',
                        license_plate: d.license_plate || '',
                        status: d.status
                    });
                    return d.product_type;
                }
            } else {
                const fallback = await res.json();
                console.error('Error al cargar despacho individual:', fallback);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
        return null;
    };

    const generateDefaults = async () => {
        let serverDate = getLocalDateStr(); 
        try {
            const res = await fetch(`${API_BASE_URL}/api/server-time`);
            if (res.ok) {
                const data = await res.json();
                serverDate = data.datetime.substring(0, 16);
            }
        } catch (err) {
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            serverDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        }
        
        try {
            const resN = await fetch(`${API_BASE_URL}/api/dispatches/next-order-number`);
            let nextOrderNum = '';
            if (resN.ok) {
                const data = await resN.json();
                nextOrderNum = data.nextOrderNumber;
            }
            if (!nextOrderNum) {
                const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                nextOrderNum = `TRP${randStr}`;
            }
            setFormData(prev => ({
                ...prev,
                dispatch_datetime: serverDate,
                order_number: nextOrderNum
            }));
            setOrderNumberError('');
        } catch (err) {
            console.error(err);
            const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
            const nextOrderNum = `TRP${randStr}`;
            setFormData(prev => ({
                ...prev,
                dispatch_datetime: serverDate,
                order_number: nextOrderNum
            }));
            setOrderNumberError('');
        }
    };

    const handleDriverChange = (e) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, driver_name: val }));
        if (val.trim() !== '') {
            const filtered = (historicalSuggestions.drivers || []).filter(d => d.toLowerCase().includes(val.toLowerCase()));
            setDriverSuggestions(filtered);
            setShowDriverSuggestions(true);
        } else {
            setDriverSuggestions((historicalSuggestions.drivers || []).slice(0, 5));
            setShowDriverSuggestions(true);
        }
    };

    const handlePlateChange = (e) => {
        const val = e.target.value.toUpperCase();
        setFormData(prev => ({ ...prev, license_plate: val }));
        if (val.trim() !== '') {
            const filtered = (historicalSuggestions.plates || []).filter(p => p.toLowerCase().includes(val.toLowerCase()));
            setPlateSuggestions(filtered);
            setShowPlateSuggestions(true);
        } else {
            setPlateSuggestions((historicalSuggestions.plates || []).slice(0, 5));
            setShowPlateSuggestions(true);
        }
    };

    const checkOrderUniqueness = async (orderNum) => {
        if (!orderNum || !orderNum.trim()) {
            setOrderNumberError('El número de orden es obligatorio.');
            return false;
        }

        const valTrim = orderNum.trim();
        // Validar formato de 6 o 7 caracteres alfanuméricos
        const isFormatValid = /^[a-zA-Z0-9]{6,7}$/.test(valTrim);
        if (!isFormatValid) {
            setOrderNumberError('El número de orden debe tener exactamente 6 o 7 caracteres (letras y números sin espacios).');
            return false;
        }
        
        setCheckingOrderNumber(true);
        try {
            let url = `${API_BASE_URL}/api/dispatches/check-order?order_number=${encodeURIComponent(valTrim)}`;
            if (isEdit) {
                url += `&excludeId=${id}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.exists) {
                    setOrderNumberError('El número de orden alfanumérico ya se encuentra registrado.');
                    setCheckingOrderNumber(false);
                    return false;
                }
            }
            setOrderNumberError('');
            setCheckingOrderNumber(false);
            return true;
        } catch (err) {
            console.error('Error al validar número de orden:', err);
            setCheckingOrderNumber(false);
            return true;
        }
    };

    const handleOrderNumberChange = (e) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, order_number: val }));
        
        if (val.trim() === '') {
            setOrderNumberError('El número de orden es obligatorio y no puede estar vacío.');
        } else {
            const isFormatValid = /^[a-zA-Z0-9]{6,7}$/.test(val.trim());
            if (!isFormatValid) {
                setOrderNumberError('El número de orden debe tener exactamente 6 o 7 caracteres (letras y números sin espacios).');
            } else {
                checkOrderUniqueness(val);
            }
        }
    };

    const handleOrderNumberBlur = async () => {
        if (!formData.order_number || !formData.order_number.trim()) {
            try {
                const resN = await fetch(`${API_BASE_URL}/api/dispatches/next-order-number`);
                let nextOrderNum = '';
                if (resN.ok) {
                    const data = await resN.json();
                    nextOrderNum = data.nextOrderNumber;
                }
                if (!nextOrderNum) {
                    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                    nextOrderNum = `TRP${randStr}`;
                }
                setFormData(prev => ({ ...prev, order_number: nextOrderNum }));
                setOrderNumberError('');
            } catch (err) {
                console.error(err);
                const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                const nextOrderNum = `TRP${randStr}`;
                setFormData(prev => ({ ...prev, order_number: nextOrderNum }));
                setOrderNumberError('');
            }
        } else {
            checkOrderUniqueness(formData.order_number);
        }
    };

    const handleSaveDispatch = async (e) => {
        e.preventDefault();
        
        if (!formData.client_id) {
            alert('Debe seleccionar un cliente del directorio.');
            return;
        }

        if (!formData.order_number || !formData.order_number.trim()) {
            alert('El número de orden es obligatorio y no puede quedar vacío.');
            return;
        }

        const isUnique = await checkOrderUniqueness(formData.order_number);
        if (!isUnique) {
            alert('El número de orden o factura ingresado ya se encuentra registrado. Por favor, especifique uno diferente.');
            return;
        }

        const qtyStr = String(formData.quantity_tm).replace(',', '.');
        const qty = parseFloat(qtyStr);
        if (isNaN(qty) || qty <= 0) {
            alert('La cantidad en toneladas métricas (tm) debe ser mayor a cero.');
            return;
        }

        // Validación de cantidad máxima (100 TM)
        if (qty > 100.0) {
            alert('La cantidad de despacho no puede exceder las 100 Toneladas Métricas (TM) por viaje según la capacidad de carga vial permitida.');
            return;
        }

        // Validación de rango de fecha y hora de despacho (±7 días respecto a la actual)
        const dispatchDate = new Date(formData.dispatch_datetime);
        if (isNaN(dispatchDate.getTime())) {
            alert('La fecha y hora de despacho no tiene un formato válido.');
            return;
        }
        const now = new Date();
        const minDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        if (dispatchDate < minDate || dispatchDate > maxDate) {
            alert('La fecha de despacho seleccionada debe estar en el rango de ±7 días respecto a la fecha actual del sistema para evitar errores de registro.');
            return;
        }

        setSaving(true);
        const payload = {
            ...formData,
            quantity_tm: Math.round(qty * 1000) / 1000,
            created_by: JSON.parse(localStorage.getItem('tripoliven_user'))?.id || null
        };

        const url = isEdit ? `${API_BASE_URL}/api/dispatches/${id}` : `${API_BASE_URL}/api/dispatches`;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok) {
                if (!isEdit) {
                    localStorage.removeItem('tripoliven_dispatch_draft');
                }
                navigate('/dispatches');
            } else {
                alert(data.error || 'Error al guardar el despacho.');
            }
        } catch (err) {
            alert('Error en la conexión con el servidor backend.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNewClient = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientForm)
            });
            const data = await res.json();
            if (res.ok) {
                setClients([data, ...clients]);
                setShowClientModal(false);
                setClientForm({ name: '', rif: '', state: '', address: '', phone: '', contact_person: '', email: '' });
                selectClient(data);
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Error al guardar cliente.');
        }
    };

    const filteredSuggestions = clientSearch 
        ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.rif.toLowerCase().includes(clientSearch.toLowerCase()))
        : clients.slice(0, 5);

    const selectClient = (client) => {
        setSelectedClientObj(client);
        setClientSearch(client.name);
        setFormData(prev => ({
            ...prev,
            client_id: client.id,
            destination_state: prev.destination_state || client.state
        }));
        setShowSuggestions(false);
    };

    const handleClientSearchChange = (e) => {
        setClientSearch(e.target.value);
        setShowSuggestions(true);
        if (selectedClientObj) {
            setSelectedClientObj(null);
            setFormData(prev => ({ ...prev, client_id: '' }));
        }
    };

    if (loading) {
        return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Cargando estructura del formulario...</div>;
    }

    return (
        <div style={{ zIndex: 1, position: 'relative' }}>
            
            {/* HEADER DE LA PÁGINA */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '36px' }}>
                <button 
                    onClick={() => navigate('/dispatches')}
                    style={{ 
                        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', 
                        borderRadius: '14px', width: '46px', height: '46px', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
                    }}
                    onMouseOver={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                    onMouseOut={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                            <div style={{ padding: '10px', borderRadius: '14px', background: 'var(--accent-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 15px rgba(37, 99, 235, 0.3)' }}>
                                <Truck size={24} />
                            </div>
                            {isEdit ? 'Editar Despacho Logístico' : 'Registrar Nuevo Despacho'}
                        </h1>
                        {!isEdit && draftSavedTime && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <CheckCircle2 size={14} /> Guardado automático en borrador ({draftSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                            </span>
                        )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                        {isEdit ? 'Modifica los datos y especificaciones de esta orden corporativa.' : 'Ingresa la información comercial y de logística para generar una nueva orden de salida.'}
                    </p>
                </div>
            </div>

            {/* BANNER DE BORRADOR DETECTADO */}
            {showDraftBanner && savedDraftData && (
                <div style={{
                    background: 'var(--bg-tertiary)', border: '1px solid var(--accent-primary)',
                    borderRadius: '20px', padding: '20px 24px', marginBottom: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
                    boxShadow: '0 12px 32px rgba(37, 99, 235, 0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(37, 99, 235, 0.15)', color: 'var(--accent-primary)' }}>
                            <Save size={24} />
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1.1rem', fontWeight: '700' }}>Se encontró un borrador en curso</h4>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Tienes datos guardados el {new Date(savedDraftData.savedAt).toLocaleDateString()} a las {new Date(savedDraftData.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ¿Deseas reanudar tu registro?
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={handleRestoreDraft}
                            style={{
                                background: 'var(--accent-gradient)', border: 'none', color: 'white',
                                padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
                                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)'
                            }}
                        >
                            Restaurar borrador
                        </button>
                        <button
                            type="button"
                            onClick={handleDiscardDraft}
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#f87171', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem'
                            }}
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}

            {/* TARJETA DEL FORMULARIO PRINCIPAL */}
            <div className="card" style={{ maxWidth: '950px', margin: '0 auto', padding: '40px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                <form onSubmit={handleSaveDispatch}>
                    
                    {/* SECCIÓN 1: ORDEN Y FECHA */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Número de Orden *</label>
                            <input 
                                required
                                type="text"
                                value={formData.order_number}
                                onChange={handleOrderNumberChange}
                                onBlur={handleOrderNumberBlur}
                                placeholder="Ingresar código de orden..."
                                style={{ 
                                    width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', 
                                    border: '1px solid', 
                                    borderColor: orderNumberError ? '#ef4444' : 'var(--glass-border)',
                                    color: 'var(--text-primary)', fontFamily: 'inherit', 
                                    fontSize: '0.95rem', fontWeight: '700', outline: 'none', transition: 'all 0.2s'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = orderNumberError ? '#ef4444' : 'var(--accent-primary)'}
                            />
                            {orderNumberError && (
                                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px', fontWeight: '600' }}>{orderNumberError}</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Fecha y Hora Exacta de Salida *</label>
                            <input 
                                required
                                type="datetime-local"
                                value={formData.dispatch_datetime}
                                onChange={e => setFormData({...formData, dispatch_datetime: e.target.value})}
                                style={{ 
                                    width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', 
                                    border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', 
                                    fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s', fontWeight: '500'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                            />
                        </div>
                    </div>

                    {/* SECCIÓN 2: CLIENTE Y AUTOCOMPLETE */}
                    <div style={{ marginBottom: '36px' }} ref={searchRef}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                            <label style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Building2 size={18} color="var(--accent-primary)" />
                                Selección de Cliente Corporativo *
                            </label>
                            <button 
                                type="button"
                                onClick={() => setShowClientModal(true)}
                                style={{ 
                                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--accent-primary)', 
                                    padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', 
                                    fontSize: '0.85rem', fontWeight: '700', transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = '#ffffff'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                            >
                                <Plus size={16} /> Registrar Cliente Rápido
                            </button>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: selectedClientObj ? 'var(--success)' : 'var(--text-secondary)', transition: 'color 0.2s' }} />
                            <input 
                                type="text"
                                placeholder="Escribe para buscar por razón social o RIF del cliente..."
                                value={clientSearch}
                                onChange={handleClientSearchChange}
                                onFocus={() => setShowSuggestions(true)}
                                style={{ 
                                    width: '100%', padding: '16px 48px 16px 52px', borderRadius: '16px', 
                                    background: 'var(--bg-tertiary)', border: '2px solid', 
                                    color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '1rem', outline: 'none',
                                    fontWeight: selectedClientObj ? '700' : '500', transition: 'all 0.2s',
                                    borderColor: selectedClientObj ? 'var(--success)' : 'var(--glass-border)'
                                }}
                            />
                            {selectedClientObj && (
                                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '8px', color: 'var(--success)', fontSize: '0.8rem', fontWeight: '700' }}>
                                    <CheckCircle2 size={16} /> Verificado
                                </div>
                            )}

                            {/* DESPLEGABLE DE SUGERENCIAS */}
                            {showSuggestions && !selectedClientObj && (
                                <div style={{ 
                                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                                    background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                                    borderRadius: '16px', overflow: 'hidden', zIndex: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    {filteredSuggestions.length > 0 ? (
                                        filteredSuggestions.map((c, idx) => (
                                            <div 
                                                key={c.id}
                                                onClick={() => selectClient(c)}
                                                style={{ 
                                                    padding: '16px 20px', borderBottom: idx === filteredSuggestions.length - 1 ? 'none' : '1px solid var(--glass-border)', 
                                                    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'background 0.2s' 
                                                }}
                                                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span>{c.name}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', background: 'var(--glass-bg)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>Seleccionar</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><strong>RIF:</strong> {c.rif}</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><strong>Estado:</strong> {c.state}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No se encontraron coincidencias en el directorio.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* TARJETA VIP DEL CLIENTE SELECCIONADO */}
                        {selectedClientObj && (
                            <div style={{ 
                                marginTop: '16px', padding: '20px 24px', background: 'var(--bg-tertiary)', 
                                border: '1px solid var(--glass-border)', borderRadius: '16px', 
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>DOCUMENTO DE IDENTIDAD / RIF</span>
                                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '700' }}>{selectedClientObj.rif}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>CONTACTO TELEFÓNICO</span>
                                    <strong style={{ fontSize: '1.05rem', color: selectedClientObj.phone ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: '700' }}>
                                        {selectedClientObj.phone || 'No registrado'}
                                    </strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>ESTADO / LOCALIDAD</span>
                                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={16} color="var(--success)" /> {selectedClientObj.state}
                                    </strong>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 3: PRODUCTO A DESPACHAR */}
                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Línea de Producto Químico *</label>
                        <select
                            required
                            value={formData.product_type}
                            onChange={e => setFormData({ ...formData, product_type: e.target.value })}
                            style={{ 
                                width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', 
                                border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', 
                                fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s', fontWeight: '600'
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                        >
                            <option value="">Seleccione línea de producto...</option>
                            {productTypes.map(pt => (
                                <option key={pt.id} value={pt.name}>{pt.name}</option>
                            ))}
                        </select>
                        {productTypes.length === 0 && (
                            <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '8px', fontWeight: '600' }}>
                                ⚠️ No hay productos registrados en el sistema. Vaya al módulo "Tipos de Producto" para añadirlos.
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 4: CANTIDAD Y DESTINO */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '36px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Cantidad Exacta (TM) *</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    required
                                    type="text"
                                    placeholder="Ej: 15.50 o 15,50"
                                    value={formData.quantity_tm}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                                        setFormData({...formData, quantity_tm: val});
                                    }}
                                    style={{ 
                                        width: '100%', padding: '14px 50px 14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', 
                                        border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', 
                                        fontSize: '1.05rem', outline: 'none', transition: 'border 0.2s', fontWeight: '700'
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                                />
                                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: '700', fontSize: '0.9rem' }}>TM</span>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Estado de Destino Geográfico *</label>
                            <select 
                                required
                                value={formData.destination_state}
                                onChange={e => setFormData({...formData, destination_state: e.target.value})}
                                style={{ 
                                    width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', 
                                    border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', 
                                    fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s', fontWeight: '600'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                            >
                                <option value="">Seleccione Estado Destino...</option>
                                {VENEZUELA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '36px 0' }} />

                    {/* SECCIÓN 5: LOGÍSTICA DE CAMIÓN */}
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '20px', fontWeight: '700' }}>Logística de Transporte (Opcional)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        <div ref={driverRef} style={{ position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Nombre del Chofer / Transportista</label>
                            <input 
                                type="text"
                                placeholder="Nombre completo del conductor"
                                value={formData.driver_name}
                                onChange={handleDriverChange}
                                onFocus={() => {
                                    setDriverSuggestions(formData.driver_name ? (historicalSuggestions.drivers || []).filter(d => d.toLowerCase().includes(formData.driver_name.toLowerCase())) : (historicalSuggestions.drivers || []).slice(0, 5));
                                    setShowDriverSuggestions(true);
                                }}
                                style={{ 
                                    width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', 
                                    border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', 
                                    fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s'
                                }}
                            />
                            {showDriverSuggestions && driverSuggestions.length > 0 && (
                                <div style={{ 
                                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                                    background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                                    borderRadius: '12px', overflow: 'hidden', zIndex: 30, boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    {driverSuggestions.map((driver, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, driver_name: driver }));
                                                setShowDriverSuggestions(false);
                                            }}
                                            style={{ 
                                                padding: '10px 16px', borderBottom: idx === driverSuggestions.length - 1 ? 'none' : '1px solid var(--glass-border)', 
                                                cursor: 'pointer', transition: 'background 0.2s', color: 'var(--text-primary)', fontSize: '0.9rem' 
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {driver}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div ref={plateRef} style={{ position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Placa del Vehículo / Batea</label>
                            <input 
                                type="text"
                                placeholder="Ej: A12B34C"
                                value={formData.license_plate}
                                onChange={handlePlateChange}
                                onFocus={() => {
                                    setPlateSuggestions(formData.license_plate ? (historicalSuggestions.plates || []).filter(p => p.toLowerCase().includes(formData.license_plate.toLowerCase())) : (historicalSuggestions.plates || []).slice(0, 5));
                                    setShowPlateSuggestions(true);
                                }}
                                style={{ 
                                    width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', 
                                    border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', 
                                    fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s', textTransform: 'uppercase'
                                }}
                            />
                            {showPlateSuggestions && plateSuggestions.length > 0 && (
                                <div style={{ 
                                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                                    background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                                    borderRadius: '12px', overflow: 'hidden', zIndex: 30, boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    {plateSuggestions.map((plate, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, license_plate: plate }));
                                                setShowPlateSuggestions(false);
                                            }}
                                            style={{ 
                                                padding: '10px 16px', borderBottom: idx === plateSuggestions.length - 1 ? 'none' : '1px solid var(--glass-border)', 
                                                cursor: 'pointer', transition: 'background 0.2s', color: 'var(--text-primary)', fontSize: '0.9rem' 
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {plate}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Estatus del Despacho *</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value})}
                            style={{ 
                                width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', 
                                border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', 
                                fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s', fontWeight: '700'
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                        >
                            <option value="Despachado">Despachado (En Almacén de Salida)</option>
                            <option value="En Ruta">En Ruta (En Tránsito Logístico)</option>
                            <option value="Entregado">Entregado (Recepción Confirmada)</option>
                        </select>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                        <button 
                            type="button" 
                            onClick={() => navigate('/dispatches')}
                            style={{ 
                                background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', 
                                padding: '14px 28px', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', transition: 'all 0.2s' 
                            }}
                            onMouseOver={e => e.currentTarget.style.opacity = 0.8}
                            onMouseOut={e => e.currentTarget.style.opacity = 1}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={saving || Boolean(orderNumberError)}
                            style={{ 
                                background: 'var(--accent-gradient)', border: 'none', color: '#ffffff', 
                                padding: '14px 36px', borderRadius: '14px', 
                                cursor: (saving || Boolean(orderNumberError)) ? 'not-allowed' : 'pointer', 
                                fontWeight: '700', 
                                fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px', 
                                boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)', transition: 'all 0.2s', 
                                opacity: (saving || Boolean(orderNumberError)) ? 0.6 : 1 
                            }}
                            onMouseOver={e => e.currentTarget.style.opacity = 0.9}
                            onMouseOut={e => e.currentTarget.style.opacity = 1}
                        >
                            <Save size={20} /> {saving ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Registrar Despacho')}
                        </button>
                    </div>

                </form>
            </div>

            {/* MODAL REGISTRO CLIENTE RÁPIDO */}
            {showClientModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card" style={{
                        padding: '36px', borderRadius: '24px', width: '650px', maxWidth: '95%', 
                        border: '1px solid var(--glass-border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Building2 size={24} color="var(--accent-primary)" /> Registro Rápido de Cliente
                            </h2>
                            <button onClick={() => setShowClientModal(false)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveNewClient}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Razón Social / Nombre Completo *</label>
                                <input 
                                    required
                                    placeholder="Ej. Químicos Industriales C.A."
                                    value={clientForm.name}
                                    onChange={e => setClientForm({...clientForm, name: e.target.value})}
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none' }}
                                />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>RIF *</label>
                                    <input 
                                        required
                                        placeholder="Ej. J-12345678-9"
                                        value={clientForm.rif}
                                        onChange={e => setClientForm({...clientForm, rif: e.target.value})}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none', textTransform: 'uppercase' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Estado Geográfico *</label>
                                    <select 
                                        required
                                        value={clientForm.state}
                                        onChange={e => setClientForm({...clientForm, state: e.target.value})}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none' }}
                                    >
                                        <option value="">Seleccione Estado...</option>
                                        {VENEZUELA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Teléfono de Contacto</label>
                                    <input 
                                        placeholder="Ej. 0414-1234567"
                                        value={clientForm.phone}
                                        onChange={e => setClientForm({...clientForm, phone: e.target.value})}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Correo Electrónico Comercial</label>
                                    <input 
                                        type="email"
                                        placeholder="contacto@empresa.com"
                                        value={clientForm.email}
                                        onChange={e => setClientForm({...clientForm, email: e.target.value})}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                                <button type="button" onClick={() => setShowClientModal(false)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ background: 'var(--accent-gradient)', border: 'none', color: '#ffffff', padding: '12px 32px', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)' }}>
                                    Registrar Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
