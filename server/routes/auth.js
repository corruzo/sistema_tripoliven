const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

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
        WHERE u.username = ? AND u.status = 'Activo'
    `;
    db.get(query, [username], (err, row) => {
        const ip = req.ip || req.connection.remoteAddress;
        if (err) {
            db.logAudit(null, 'INICIO_SESION_ERROR', `Error del sistema en autenticación: ${err.message}`, ip);
            return res.status(500).json({ error: 'Error interno en la autenticación: ' + err.message });
        }
        if (!row) {
            db.logAudit(null, 'INICIO_SESION_FALLIDO', `Intento de acceso fallido con el usuario: "${username}".`, ip);
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos, o cuenta inactiva.' });
        }

        // Comparar contraseña hasheada
        const isPasswordValid = bcrypt.compareSync(password, row.password);
        if (!isPasswordValid) {
            db.logAudit(null, 'INICIO_SESION_FALLIDO', `Intento de acceso fallido con el usuario: "${username}".`, ip);
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos, o cuenta inactiva.' });
        }

        // Generar token JWT firmado
        const payload = {
            id: row.id,
            username: row.username,
            system_role: row.system_role
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

        // Eliminar contraseña de la respuesta por seguridad
        const userResponse = { ...row };
        delete userResponse.password;

        db.logAudit(row.id, 'INICIO_SESION_EXITOSO', `Sesión iniciada correctamente. Rol: ${row.system_role}.`, ip);
        res.json({ success: true, user: userResponse, token });
    });
});

module.exports = router;

