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
    const { name, rif, state, address, phone, contact_person, email } = req.body;
    
    if (!name || !rif || !state) {
        return res.status(400).json({ error: 'Nombre, RIF y Estado son obligatorios.' });
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
        
        db.get("SELECT * FROM clients WHERE id = ?", [this.lastID], (err, row) => {
            res.status(201).json(row);
        });
    });
});

// Actualizar cliente
router.put('/:id', (req, res) => {
    const { name, rif, state, address, phone, contact_person, email } = req.body;
    
    if (!name || !rif || !state) {
        return res.status(400).json({ error: 'Nombre, RIF y Estado son obligatorios.' });
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
        res.json({ success: true, changes: this.changes });
    });
});

// Eliminar cliente
router.delete('/:id', (req, res) => {
    // Verificar si el cliente tiene despachos asociados
    db.get("SELECT count(*) as count FROM dispatches WHERE client_id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Error de base de datos.' });
        if (row.count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el cliente porque tiene despachos asociados.' });
        }

        db.run("DELETE FROM clients WHERE id = ?", [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: 'Error al eliminar cliente.' });
            res.json({ success: true, changes: this.changes });
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
