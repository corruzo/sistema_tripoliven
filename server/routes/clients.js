const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');

// Obtener todos los clientes
router.get('/', authenticateJWT, (req, res) => {
    db.all("SELECT * FROM clients ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener clientes.' });
        }
        res.json(rows);
    });
});

// Crear nuevo cliente
// Duplicate route removed - using async implementation below
router.post('/', authenticateJWT, async (req, res) => {
    let { name, rif, state, address, phone, contact_person, email } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'El Nombre es obligatorio.' });
    }

    // Generate unique pending RIF if not provided
    if (!rif || rif.trim() === '') {
        let unique = false;
        while (!unique) {
            const candidate = `PENDIENTE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
            // Check existence
            const existing = await new Promise((resolve) => {
                db.get('SELECT id FROM clients WHERE rif = ?', [candidate], (err, row) => {
                    if (err) resolve(null);
                    else resolve(row);
                });
            });
            if (!existing) {
                rif = candidate;
                unique = true;
            } else {
                await new Promise(r => setTimeout(r, 10));
            }
        }
    }

    if (!state || state.trim() === '') {
        state = 'Sin Registrar';
    }

    const insertSql = `INSERT INTO clients (name, rif, state, address, phone, contact_person, email) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    // Wrap db.run in a promise
    const result = await new Promise((resolve, reject) => {
        db.run(insertSql, [name, rif, state, address, phone, contact_person, email], function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    }).catch(err => err);

    if (result instanceof Error) {
        if (result.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'El RIF ya está registrado.' });
        }
        return res.status(500).json({ error: 'Error al crear cliente.' });
    }

    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user.id;
    await db.logAudit(userId, 'CLIENTE_CREADO', `Se registró el cliente "${name}" (RIF: ${rif}, Estado: ${state}).`, ip);
    const newClient = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM clients WHERE id = ?', [result.lastID], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
    res.status(201).json(newClient);
});

// Actualizar cliente
router.put('/:id', authenticateJWT, (req, res) => {
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
        const userId = req.user.id;
        db.logAudit(userId, 'CLIENTE_EDITADO', `Se actualizaron los datos del cliente ID ${req.params.id} ("${name}", RIF: ${rif}, Estado: ${state}).`, ip);
        
        res.json({ success: true, changes: this.changes });
    });
});

// Eliminar cliente
router.delete('/:id', authenticateJWT, requireRole(['Administrador', 'Supervisor']), (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user.id;

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
router.get('/search', authenticateJWT, (req, res) => {
    const term = req.query.q;
    if (!term) return res.json([]);
    
    db.all("SELECT * FROM clients WHERE name LIKE ? OR rif LIKE ? LIMIT 10", [`%${term}%`, `%${term}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al buscar clientes.' });
        res.json(rows);
    });
});

module.exports = router;
