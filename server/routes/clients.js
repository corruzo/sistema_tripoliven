const express = require('express');
const router = express.Router();
const db = require('../database');

// Obtener todos los clientes
router.get('/', (req, res) => {
    db.all("SELECT * FROM clients ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener clientes.' });
        }
        res.json(rows);
    });
});

// Crear nuevo cliente
router.post('/', (req, res) => {
    let { name, rif, state, address, phone, contact_person, email } = req.body;
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'El Nombre es obligatorio.' });
    }

    if (!rif || rif.trim() === '') {
        rif = `PENDIENTE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    }

    if (!state || state.trim() === '') {
        state = 'Sin Registrar';
    }

    const stmt = db.prepare(`
        INSERT INTO clients (name, rif, state, address, phone, contact_person, email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([name, rif, state, address, phone, contact_person, email], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'El RIF ya está registrado.' });
            }
            return res.status(500).json({ error: 'Error al crear cliente.' });
        }
        
        const ip = req.ip || req.connection.remoteAddress;
        const userId = req.headers['x-user-id'] || null;
        db.logAudit(userId, 'CLIENTE_CREADO', `Se registró el cliente "${name}" (RIF: ${rif}, Estado: ${state}).`, ip);
        
        db.get("SELECT * FROM clients WHERE id = ?", [this.lastID], (err, row) => {
            res.status(201).json(row);
        });
    });
});

// Actualizar cliente
router.put('/:id', (req, res) => {
    let { name, rif, state, address, phone, contact_person, email } = req.body;
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'El Nombre es obligatorio.' });
    }

    if (!rif || rif.trim() === '') {
        rif = `PENDIENTE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    }

    if (!state || state.trim() === '') {
        state = 'Sin Registrar';
    }

    const query = `
        UPDATE clients 
        SET name = ?, rif = ?, state = ?, address = ?, phone = ?, contact_person = ?, email = ?
        WHERE id = ?
    `;
    const params = [name, rif, state, address, phone, contact_person, email, req.params.id];


    db.run(query, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'El RIF ya está registrado por otro cliente.' });
            }
            return res.status(500).json({ error: 'Error al actualizar el cliente.' });
        }
        
        const ip = req.ip || req.connection.remoteAddress;
        const userId = req.headers['x-user-id'] || null;
        db.logAudit(userId, 'CLIENTE_EDITADO', `Se actualizaron los datos del cliente ID ${req.params.id} ("${name}", RIF: ${rif}, Estado: ${state}).`, ip);
        
        res.json({ success: true, changes: this.changes });
    });
});

// Eliminar cliente
router.delete('/:id', (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.headers['x-user-id'] || null;

    db.get("SELECT name, rif FROM clients WHERE id = ?", [req.params.id], (err, clientRow) => {
        if (err) return res.status(500).json({ error: 'Error de base de datos.' });
        if (!clientRow) return res.status(404).json({ error: 'Cliente no encontrado.' });

        // Verificar si el cliente tiene despachos asociados
        db.get("SELECT count(*) as count FROM dispatches WHERE client_id = ?", [req.params.id], (err, row) => {
            if (err) return res.status(500).json({ error: 'Error de base de datos.' });
            if (row.count > 0) {
                return res.status(400).json({ error: 'No se puede eliminar el cliente porque tiene despachos asociados.' });
            }

            db.run("DELETE FROM clients WHERE id = ?", [req.params.id], function(err) {
                if (err) return res.status(500).json({ error: 'Error al eliminar cliente.' });
                db.logAudit(userId, 'CLIENTE_ELIMINADO', `Se eliminó el cliente ID ${req.params.id} ("${clientRow.name}", RIF: ${clientRow.rif}).`, ip);
                res.json({ success: true, changes: this.changes });
            });
        });
    });
});

// Buscar clientes
router.get('/search', (req, res) => {
    const term = req.query.q;
    if (!term) return res.json([]);
    
    db.all("SELECT * FROM clients WHERE name LIKE ? OR rif LIKE ? LIMIT 10", [`%${term}%`, `%${term}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al buscar clientes.' });
        res.json(rows);
    });
});

module.exports = router;
