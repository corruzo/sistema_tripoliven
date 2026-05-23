const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');

// GET all users (Autenticado para cualquier rol registrado)
router.get('/', authenticateJWT, (req, res) => {
    const query = `
        SELECT u.id, u.name, u.email, u.username, u.system_role, u.status, u.position_id, u.department_id,
               p.name as position_name, d.name as department_name
        FROM users u
        LEFT JOIN positions p ON u.position_id = p.id
        LEFT JOIN departments d ON u.department_id = d.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ error: 'Error interno al obtener usuarios.' });
        }
        res.json(rows);
    });
});

// POST new user (Solo administradores)
router.post('/', authenticateJWT, requireRole(['Administrador']), (req, res) => {
    const { name, email, username, password, system_role, status, position_id, department_id } = req.body;
    
    if (!name || !email || !username || !password) {
        return res.status(400).json({ error: 'Nombre, Correo, Nombre de usuario y Contraseña son obligatorios.' });
    }

    // Hashear contraseña antes de guardar en SQLite
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run("INSERT INTO users (name, email, username, password, system_role, status, position_id, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
    [name, email, username, hashedPassword, system_role, status, position_id || null, department_id || null], function(err) {
        if (err) {
            if (err.message && err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'El correo electrónico o nombre de usuario ya existe.' });
            }
            console.error('Error al registrar usuario:', err);
            return res.status(500).json({ error: 'Error interno al registrar usuario.' });
        }
        
        // Log inmutable en el backend
        const ip = req.ip || req.connection.remoteAddress;
        db.logAudit(req.user.id, 'USUARIO_CREADO', `Se registró el usuario "${username}" con el rol "${system_role}".`, ip);

        res.json({ id: this.lastID, name, email, username, system_role, status, position_id, department_id });
    });
});

// PUT update user (Solo administradores)
router.put('/:id', authenticateJWT, requireRole(['Administrador']), (req, res) => {
    const { name, email, username, password, system_role, status, position_id, department_id } = req.body;
    
    if (!name || !email || !username) {
        return res.status(400).json({ error: 'Nombre, Correo y Nombre de usuario son obligatorios.' });
    }

    let query = "UPDATE users SET name = ?, email = ?, username = ?, system_role = ?, status = ?, position_id = ?, department_id = ? WHERE id = ?";
    let params = [name, email, username, system_role, status, position_id || null, department_id || null, req.params.id];
    
    if (password) {
        // Hashear la contraseña si se está modificando
        const hashedPassword = bcrypt.hashSync(password, 10);
        query = "UPDATE users SET name = ?, email = ?, username = ?, password = ?, system_role = ?, status = ?, position_id = ?, department_id = ? WHERE id = ?";
        params = [name, email, username, hashedPassword, system_role, status, position_id || null, department_id || null, req.params.id];
    }

    db.run(query, params, function(err) {
        if (err) {
            if (err.message && err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'El correo electrónico o nombre de usuario ya existe.' });
            }
            console.error('Error al actualizar usuario:', err);
            return res.status(500).json({ error: 'Error interno al actualizar usuario.' });
        }
        
        // Log inmutable en el backend
        const ip = req.ip || req.connection.remoteAddress;
        db.logAudit(req.user.id, 'USUARIO_EDITADO', `Se actualizaron los datos del usuario ID ${req.params.id} ("${username}").`, ip);

        res.json({ success: true, changes: this.changes });
    });
});

// DELETE user (Solo administradores)
router.delete('/:id', authenticateJWT, requireRole(['Administrador']), (req, res) => {
    // Evitar que el administrador se elimine a sí mismo
    if (parseInt(req.params.id) === req.user.id) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de usuario en sesión.' });
    }

    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
        if (err) {
            console.error('Error al eliminar usuario:', err);
            return res.status(500).json({ error: 'Error interno al eliminar usuario.' });
        }
        
        // Log inmutable en el backend
        const ip = req.ip || req.connection.remoteAddress;
        db.logAudit(req.user.id, 'USUARIO_ELIMINADO', `Se eliminó el usuario ID ${req.params.id}.`, ip);

        res.json({ success: true, changes: this.changes });
    });
});

module.exports = router;
