const express = require('express');
const router = express.Router();
const db = require('../database');

// POST login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos.' });
    }

    const query = `
        SELECT u.*, p.name as position_name, d.name as department_name
        FROM users u
        LEFT JOIN positions p ON u.position_id = p.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.username = ? AND u.password = ? AND u.status = 'Activo'
    `;
    db.get(query, [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: 'Error interno en la autenticación: ' + err.message });
        if (!row) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos, o cuenta inactiva.' });
        }
        res.json({ success: true, user: row });
    });
});

module.exports = router;
