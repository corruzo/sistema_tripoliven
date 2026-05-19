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
    const now = Date.now();
    if (analyticsCache && (now - cacheTimestamp < CACHE_TTL)) {
        return res.json(analyticsCache);
    }

    const query = `
        SELECT d.*, c.name as client_name 
        FROM dispatches d
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE d.status != 'Anulado'
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al calcular analíticas: ' + err.message });

        let totalQuantity = 0;
        let activeDispatches = 0;
        const stateMap = {};
        const productMap = {};
        const clientMap = {};
        const monthMap = {};
        const dateMap = {};

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        rows.forEach(d => {
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

        analyticsCache = {
            cachedAt: new Date().toISOString(),
            totalQuantity,
            avgQuantity: rows.length > 0 ? round2(totalQuantity / rows.length) : 0,
            totalDispatches: rows.length,
            activeDispatches,
            destinationsArray,
            productsArray,
            clientsArray,
            monthsArray,
            dailyArray
        };
        cacheTimestamp = now;

        res.json(analyticsCache);
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
        res.json(rows);
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
        res.json({ success: true, changes: this.changes, status });
    });
});

// DELETE dispatch record (Auditoría: Físico antes de 20 min, Anulación después de 20 min)
router.delete('/:id', (req, res) => {
    db.get("SELECT createdAt FROM dispatches WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Error al verificar despacho: ' + err.message });
        if (!row) return res.status(404).json({ error: 'Despacho no encontrado.' });

        const createdLocalStr = row.createdAt ? row.createdAt.replace(' ', 'T') : null;
        const createdDate = createdLocalStr ? new Date(createdLocalStr) : new Date();
        const now = new Date();
        const diffMs = now - createdDate;
        const diffMins = diffMs / 1000 / 60;

        if (diffMins > 20) {
            db.run("UPDATE dispatches SET status = 'Anulado' WHERE id = ?", [req.params.id], function(err) {
                if (err) return res.status(500).json({ error: 'Error al anular despacho: ' + err.message });
                invalidateCache();
                res.json({ success: true, mode: 'annulled', changes: this.changes });
            });
        } else {
            db.run("DELETE FROM dispatches WHERE id = ?", [req.params.id], function(err) {
                if (err) return res.status(500).json({ error: 'Error al eliminar despacho: ' + err.message });
                invalidateCache();
                res.json({ success: true, mode: 'deleted', changes: this.changes });
            });
        }
    });
});

module.exports = router;
