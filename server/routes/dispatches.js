const express = require('express');
const router = express.Router();
const db = require('../database');

let analyticsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; 

const invalidateCache = () => {
    analyticsCache = null;
};

router.get('/analytics', (req, res) => {
    const { startDate, endDate } = req.query;
    const now = Date.now();
    
    // Si no hay parámetros de filtro por fecha, podemos usar la caché general
    const isFiltered = !!(startDate || endDate);
    if (!isFiltered && analyticsCache && (now - cacheTimestamp < CACHE_TTL)) {
        return res.json(analyticsCache);
    }

    let query = `
        SELECT d.*, c.name as client_name 
        FROM dispatches d
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE d.status != 'Anulado'
    `;
    const params = [];

    if (startDate) {
        query += " AND d.dispatch_datetime >= ?";
        params.push(startDate + "T00:00:00");
    }
    if (endDate) {
        query += " AND d.dispatch_datetime <= ?";
        params.push(endDate + "T23:59:59");
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al calcular analíticas: ' + err.message });

        // Ya vienen filtradas de la base de datos si se especificó el filtro (guardado defensivo)
        const filteredRows = rows || [];

        let totalQuantity = 0;
        let activeDispatches = 0;
        const stateMap = {};
        const productMap = {};
        const clientMap = {};
        const monthMap = {};
        const dateMap = {};

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        filteredRows.forEach(d => {
            const qty = parseFloat(d.quantity_tm) || 0;
            totalQuantity += qty;

            if (d.status !== 'Entregado') {
                activeDispatches++;
            }

            // Agregación por Estado
            const state = d.destination_state || 'Otro';
            stateMap[state] = (stateMap[state] || 0) + qty;

            // Agregación por Producto
            const prod = d.product_type || 'Otro';
            productMap[prod] = (productMap[prod] || 0) + qty;

            // Agregación por Cliente
            const client = d.client_name || 'Desconocido';
            clientMap[client] = (clientMap[client] || 0) + qty;

            // Agregación Mensual
            const dateStr = d.dispatch_datetime ? d.dispatch_datetime.split('T')[0] : '';
            if (dateStr) {
                const parts = dateStr.split('-');
                if (parts.length >= 2) {
                    const year = parts[0];
                    const monthNum = parseInt(parts[1], 10);
                    const label = `${monthNames[monthNum - 1]} ${year}`;
                    const rawKey = dateStr.substring(0, 7);

                    if (!monthMap[rawKey]) monthMap[rawKey] = { label, tm: 0 };
                    monthMap[rawKey].tm += qty;
                }

                // Agregación Diaria
                dateMap[dateStr] = (dateMap[dateStr] || 0) + qty;
            }
        });

        const round2 = (val) => Math.round(val * 1000) / 1000;
        totalQuantity = round2(totalQuantity);

        const destinationsArray = Object.keys(stateMap)
            .map(name => ({ name, value: round2(stateMap[name]) }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

        const productsArray = Object.keys(productMap)
            .map(name => ({ name, value: round2(productMap[name]) }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

        const clientsArray = Object.keys(clientMap)
            .map(name => ({ name, value: round2(clientMap[name]) }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

        const monthsArray = Object.keys(monthMap)
            .map(rawKey => ({ name: monthMap[rawKey].label, rawKey, value: round2(monthMap[rawKey].tm) }))
            .sort((a, b) => a.rawKey.localeCompare(b.rawKey));

        const dailyArray = Object.keys(dateMap)
            .map(date => ({ date, tm: round2(dateMap[date]) }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-7);

        const result = {
            cachedAt: isFiltered ? null : new Date().toISOString(),
            totalQuantity,
            avgQuantity: filteredRows.length > 0 ? round2(totalQuantity / filteredRows.length) : 0,
            totalDispatches: filteredRows.length,
            activeDispatches,
            destinationsArray,
            productsArray,
            clientsArray,
            monthsArray,
            dailyArray
        };

        if (!isFiltered) {
            analyticsCache = result;
            cacheTimestamp = now;
        }

        res.json(result);
    });
});

// Generar un código alfanumérico aleatorio único de 6 o 7 caracteres (letras y números)
const generateRandomAlphanumeric = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

router.get('/next-order-number', (req, res) => {
    // Alternar de forma aleatoria entre longitudes de 6 y 7 caracteres
    const length = Math.random() < 0.5 ? 6 : 7;
    
    const checkAndGenerate = () => {
        const candidate = generateRandomAlphanumeric(length);
        db.get("SELECT id FROM dispatches WHERE order_number = ?", [candidate], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Error al generar código alfanumérico: ' + err.message });
            }
            if (row) {
                // Colisión (altamente improbable), reintentar generación
                checkAndGenerate();
            } else {
                res.json({ nextOrderNumber: candidate });
            }
        });
    };
    
    checkAndGenerate();
});

// Validar si un número de orden ya existe
router.get('/check-order', (req, res) => {
    const { order_number, excludeId } = req.query;
    if (!order_number) {
        return res.status(400).json({ error: 'El número de orden es obligatorio para la validación.' });
    }
    
    let query = "SELECT id FROM dispatches WHERE order_number = ?";
    let params = [order_number.trim()];
    
    if (excludeId) {
        query += " AND id != ?";
        params.push(excludeId);
    }
    
    db.get(query, params, (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar disponibilidad del número de orden: ' + err.message });
        }
        res.json({ exists: !!row });
    });
});

// GET all dispatches with optional date period filtering
router.get('/', (req, res) => {
    const { startDate, endDate } = req.query;
    let query = `
        SELECT d.*, c.name as client_name, c.rif as client_rif 
        FROM dispatches d
        LEFT JOIN clients c ON d.client_id = c.id
    `;
    let params = [];

    if (startDate && endDate) {
        query += " WHERE d.dispatch_datetime BETWEEN ? AND ?";
        params.push(startDate, endDate);
    } else if (startDate) {
        query += " WHERE d.dispatch_datetime >= ?";
        params.push(startDate);
    } else if (endDate) {
        query += " WHERE d.dispatch_datetime <= ?";
        params.push(endDate);
    }

    query += " ORDER BY d.dispatch_datetime DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al obtener despachos: ' + err.message });
        res.json(rows || []);
    });
});

// POST register new dispatch
router.post('/', (req, res) => {
    const { 
        client_id, product_type, quantity_tm, 
        destination_state, dispatch_datetime, order_number, 
        driver_name, license_plate, status, created_by 
    } = req.body;

    if (!client_id || !product_type || !quantity_tm || !destination_state || !dispatch_datetime || !order_number) {
        return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
    }

    const query = `
        INSERT INTO dispatches 
        (client_id, product_type, quantity_tm, destination_state, dispatch_datetime, order_number, driver_name, license_plate, status, created_by, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
    `;
    const params = [
        client_id, product_type, parseFloat(quantity_tm), 
        destination_state, dispatch_datetime, order_number, 
        driver_name || null, license_plate || null, status || 'Despachado', created_by || null
    ];

    db.run(query, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'El número de orden o factura ya se encuentra registrado.' });
            }
            return res.status(500).json({ error: 'Error al registrar el despacho: ' + err.message });
        }
        invalidateCache();
        const ip = req.ip || req.connection.remoteAddress;
        db.logAudit(created_by || req.headers['x-user-id'], 'DESPACHO_CREADO', `Se creó el despacho de orden "${order_number}" para el cliente ID ${client_id} (${quantity_tm} TM de ${product_type}).`, ip);
        res.json({ 
            id: this.lastID, client_id, product_type, quantity_tm, 
            destination_state, dispatch_datetime, order_number, driver_name, license_plate, status 
        });
    });
});

// PUT update existing dispatch
router.put('/:id', (req, res) => {
    const { 
        client_id, product_type, quantity_tm, 
        destination_state, dispatch_datetime, order_number, 
        driver_name, license_plate, status 
    } = req.body;

    if (!client_id || !product_type || !quantity_tm || !destination_state || !dispatch_datetime || !order_number) {
        return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
    }

    const query = `
        UPDATE dispatches 
        SET client_id = ?, product_type = ?, quantity_tm = ?, 
            destination_state = ?, dispatch_datetime = ?, order_number = ?, 
            driver_name = ?, license_plate = ?, status = ?
        WHERE id = ?
    `;
    const params = [
        client_id, product_type, parseFloat(quantity_tm), 
        destination_state, dispatch_datetime, order_number, 
        driver_name || null, license_plate || null, status, req.params.id
    ];

    db.run(query, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'El número de orden o factura ya se encuentra registrado por otro despacho.' });
            }
            return res.status(500).json({ error: 'Error al actualizar el despacho: ' + err.message });
        }
        invalidateCache();
        const ip = req.ip || req.connection.remoteAddress;
        const userId = req.headers['x-user-id'] || null;
        db.logAudit(userId, 'DESPACHO_EDITADO', `Se actualizaron los datos del despacho ID ${req.params.id} (Orden "${order_number}", Cliente ID ${client_id}, ${quantity_tm} TM de ${product_type}).`, ip);
        res.json({ success: true, changes: this.changes });
    });
});

// PUT update only dispatch status
router.put('/:id/status', (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'El estatus es obligatorio.' });

    db.run("UPDATE dispatches SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Error al actualizar estatus: ' + err.message });
        invalidateCache();
        const ip = req.ip || req.connection.remoteAddress;
        const userId = req.headers['x-user-id'] || null;
        db.logAudit(userId, 'DESPACHO_ESTADO_MODIFICADO', `Se modificó el estatus del despacho ID ${req.params.id} a "${status}".`, ip);
        res.json({ success: true, changes: this.changes, status });
    });
});

// DELETE dispatch record (Auditoría: Físico antes de 20 min, Anulación después de 20 min)
router.delete('/:id', (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.headers['x-user-id'] || null;

    db.get("SELECT order_number, createdAt FROM dispatches WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Error al verificar despacho: ' + err.message });
        if (!row) return res.status(404).json({ error: 'Despacho no encontrado.' });

        const orderNum = row.order_number;
        const createdLocalStr = row.createdAt ? row.createdAt.replace(' ', 'T') : null;
        const createdDate = createdLocalStr ? new Date(createdLocalStr) : new Date();
        const now = new Date();
        const diffMs = now - createdDate;
        const diffMins = diffMs / 1000 / 60;

        if (diffMins > 20) {
            db.run("UPDATE dispatches SET status = 'Anulado' WHERE id = ?", [req.params.id], function(err) {
                if (err) return res.status(500).json({ error: 'Error al anular despacho: ' + err.message });
                invalidateCache();
                db.logAudit(userId, 'DESPACHO_ANULADO', `Se anuló automáticamente el despacho ID ${req.params.id} (Orden: "${orderNum}") por superar el límite de 20 minutos.`, ip);
                res.json({ success: true, mode: 'annulled', changes: this.changes });
            });
        } else {
            db.run("DELETE FROM dispatches WHERE id = ?", [req.params.id], function(err) {
                if (err) return res.status(500).json({ error: 'Error al eliminar despacho: ' + err.message });
                invalidateCache();
                db.logAudit(userId, 'DESPACHO_ELIMINADO', `Se eliminó físicamente el despacho ID ${req.params.id} (Orden: "${orderNum}") dentro del límite de 20 minutos.`, ip);
                res.json({ success: true, mode: 'deleted', changes: this.changes });
            });
        }
    });
});

module.exports = router;
