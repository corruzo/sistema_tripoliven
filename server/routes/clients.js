const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');

// Obtener todos los clientes con paginación opcional (Solo Administrador, Superusuario, Supervisor)
router.get('/', authenticateJWT, requireRole(['Administrador', 'Superusuario', 'Supervisor']), (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
    const offset = (page - 1) * limit;

    db.get("SELECT COUNT(*) as total FROM clients", [], (err, countRow) => {
        if (err) {
            console.error('Error al contar clientes:', err);
            return res.status(500).json({ error: 'Error al obtener clientes del sistema.' });
        }
        const total = countRow ? parseInt(countRow.total, 10) : 0;
        const totalPages = Math.ceil(total / limit);

        db.all("SELECT * FROM clients ORDER BY createdAt DESC LIMIT ? OFFSET ?", [limit, offset], (err, rows) => {
            if (err) {
                console.error('Error al obtener clientes:', err);
                return res.status(500).json({ error: 'Error al obtener clientes del sistema.' });
            }
            res.json({ data: rows || [], total, page, limit, totalPages });
        });
    });
});

// Crear nuevo cliente (Solo Administrador, Superusuario, Supervisor)
router.post('/', authenticateJWT, requireRole(['Administrador', 'Superusuario', 'Supervisor']), async (req, res) => {
    let { name, rif, state, address, phone, contact_person, email } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'El Nombre es obligatorio.' });
    }

    // Validar RIF antes de procesar si ha sido suministrado y no es pendiente
    if (rif && rif.trim() !== '' && !rif.startsWith('PENDIENTE-')) {
        const rifPattern = /^(V|J|E|G)-\d{8}-\d$/i;
        if (!rifPattern.test(rif.trim())) {
            return res.status(400).json({ error: 'El RIF no es válido. Debe tener el formato correcto, ej: J-12345678-9, G-12345678-9, V-12345678-9 o E-12345678-9.' });
        }
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
        if (result.message && result.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'El RIF ya está registrado.' });
        }
        console.error('Error al crear cliente:', result);
        return res.status(500).json({ error: 'Error interno al registrar el cliente.' });
    }

    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user.id;
    await db.logAudit(userId, 'CLIENTE_CREADO', `Se registró el cliente "${name}" (RIF: ${rif}, Estado: ${state}).`, ip);
    
    const newClient = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM clients WHERE id = ?', [result.lastID], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    }).catch(err => {
        console.error('Error al recuperar cliente creado:', err);
        return null;
    });

    if (!newClient) {
        return res.status(500).json({ error: 'Error al recuperar los datos del cliente creado.' });
    }

    res.status(201).json(newClient);
});

// Actualizar cliente (Solo Administrador, Superusuario, Supervisor)
router.put('/:id', authenticateJWT, requireRole(['Administrador', 'Superusuario', 'Supervisor']), (req, res) => {
    let { name, rif, state, address, phone, contact_person, email } = req.body;
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'El Nombre es obligatorio.' });
    }

    // Validar RIF antes de procesar si ha sido suministrado y no es pendiente
    if (rif && rif.trim() !== '' && !rif.startsWith('PENDIENTE-')) {
        const rifPattern = /^(V|J|E|G)-\d{8}-\d$/i;
        if (!rifPattern.test(rif.trim())) {
            return res.status(400).json({ error: 'El RIF no es válido. Debe tener el formato correcto, ej: J-12345678-9, G-12345678-9, V-12345678-9 o E-12345678-9.' });
        }
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
            if (err.message && err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'El RIF ya está registrado por otro cliente.' });
            }
            console.error('Error al actualizar cliente:', err);
            return res.status(500).json({ error: 'Error al actualizar el cliente en el sistema.' });
        }
        
        const ip = req.ip || req.connection.remoteAddress;
        const userId = req.user.id;
        db.logAudit(userId, 'CLIENTE_EDITADO', `Se actualizaron los datos del cliente ID ${req.params.id} ("${name}", RIF: ${rif}, Estado: ${state}).`, ip);
        
        res.json({ success: true, changes: this.changes });
    });
});

// Eliminar cliente (Solo Administrador, Superusuario, Supervisor)
router.delete('/:id', authenticateJWT, requireRole(['Administrador', 'Superusuario', 'Supervisor']), (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user.id;

    db.get("SELECT name, rif FROM clients WHERE id = ?", [req.params.id], (err, clientRow) => {
        if (err) {
            console.error('Error al buscar cliente para eliminar:', err);
            return res.status(500).json({ error: 'Error interno en el servidor.' });
        }
        if (!clientRow) return res.status(404).json({ error: 'Cliente no encontrado.' });

        // Verificar si el cliente tiene despachos asociados
        db.get("SELECT count(*) as count FROM dispatches WHERE client_id = ?", [req.params.id], (err, row) => {
            if (err) {
                console.error('Error al buscar despachos vinculados al cliente:', err);
                return res.status(500).json({ error: 'Error interno en el servidor.' });
            }
            if (row.count > 0) {
                return res.status(400).json({ error: 'No se puede eliminar el cliente porque tiene despachos asociados.' });
            }

            db.run("DELETE FROM clients WHERE id = ?", [req.params.id], function(err) {
                if (err) {
                    console.error('Error al eliminar cliente:', err);
                    return res.status(500).json({ error: 'Error interno al eliminar el cliente.' });
                }
                db.logAudit(userId, 'CLIENTE_ELIMINADO', `Se eliminó el cliente ID ${req.params.id} ("${clientRow.name}", RIF: ${clientRow.rif}).`, ip);
                res.json({ success: true, changes: this.changes });
            });
        });
    });
});

// Buscar clientes (Solo Administrador, Superusuario, Supervisor)
router.get('/search', authenticateJWT, requireRole(['Administrador', 'Superusuario', 'Supervisor']), (req, res) => {
    const term = req.query.q;
    if (!term) return res.json({ data: [] });
    
    db.all("SELECT * FROM clients WHERE name LIKE ? OR rif LIKE ? LIMIT 10", [`%${term}%`, `%${term}%`], (err, rows) => {
        if (err) {
            console.error('Error al buscar clientes:', err);
            return res.status(500).json({ error: 'Error al buscar clientes en el sistema.' });
        }
        res.json({ data: rows || [] });
    });
});

module.exports = router;
