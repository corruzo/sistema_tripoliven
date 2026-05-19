const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all users
router.get('/', (req, res) => {
    const query = `
        SELECT u.id, u.name, u.email, u.username, u.system_role, u.status, u.position_id, u.department_id,
               p.name as position_name, d.name as department_name
        FROM users u
        LEFT JOIN positions p ON u.position_id = p.id
        LEFT JOIN departments d ON u.department_id = d.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al obtener usuarios: ' + err.message });
        res.json(rows);
    });
});

// POST new user
router.post('/', (req, res) => {
    const { name, email, username, password, system_role, status, position_id, department_id } = req.body;
    
    if (!name || !email || !username || !password) {
        return res.status(400).json({ error: 'Nombre, Correo, Nombre de usuario y Contraseña son obligatorios.' });
    }

    db.run("INSERT INTO users (name, email, username, password, system_role, status, position_id, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
    [name, email, username, password, system_role, status, position_id || null, department_id || null], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'El correo electrónico o nombre de usuario ya existe.' });
            }
            return res.status(500).json({ error: 'Error al registrar usuario: ' + err.message });
        }
        res.json({ id: this.lastID, name, email, username, system_role, status, position_id, department_id });
    });
});

// PUT update user
router.put('/:id', (req, res) => {
    const { name, email, username, password, system_role, status, position_id, department_id } = req.body;
    
    if (!name || !email || !username) {
        return res.status(400).json({ error: 'Nombre, Correo y Nombre de usuario son obligatorios.' });
    }

    let query = "UPDATE users SET name = ?, email = ?, username = ?, system_role = ?, status = ?, position_id = ?, department_id = ? WHERE id = ?";
    let params = [name, email, username, system_role, status, position_id || null, department_id || null, req.params.id];
    
    if (password) {
        query = "UPDATE users SET name = ?, email = ?, username = ?, password = ?, system_role = ?, status = ?, position_id = ?, department_id = ? WHERE id = ?";
        params = [name, email, username, password, system_role, status, position_id || null, department_id || null, req.params.id];
    }

    db.run(query, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'El correo electrónico o nombre de usuario ya existe.' });
            }
            return res.status(500).json({ error: 'Error al actualizar usuario: ' + err.message });
        }
        res.json({ success: true, changes: this.changes });
    });
});

// DELETE user
router.delete('/:id', (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Error al eliminar usuario: ' + err.message });
        res.json({ success: true, changes: this.changes });
    });
});

module.exports = router;
