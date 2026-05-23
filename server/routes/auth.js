const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticateJWT, revokeToken } = require('../middleware/authMiddleware');

// ============================================================
// POST /login — Autenticar usuario y emitir token JWT
// ============================================================
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos.' });
    }

    const query = `
        SELECT u.id, u.username, u.password, u.name, u.system_role, u.status,
               p.name as position_name, d.name as department_name
        FROM users u
        LEFT JOIN positions p ON u.position_id = p.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.username = ? AND u.status = 'Activo'
    `;
    db.get(query, [username], (err, row) => {
        const ip = req.ip || req.connection.remoteAddress;
        if (err) {
            db.logAudit(null, 'INICIO_SESION_ERROR', `Error del sistema en autenticación: ${err.message}`, ip);
            return res.status(500).json({ error: 'Error interno en la autenticación.' });
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

        // Generar token JWT firmado — solo incluir campos mínimos necesarios
        const payload = {
            id: row.id,
            username: row.username,
            system_role: row.system_role
        };
        // Duración reducida a 8h para acotar ventana de exposición
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        // Respuesta mínima: solo datos no sensibles necesarios para la UI
        const userResponse = {
            id: row.id,
            username: row.username,
            name: row.name,
            system_role: row.system_role,
            position_name: row.position_name,
            department_name: row.department_name
        };

        db.logAudit(row.id, 'INICIO_SESION_EXITOSO', `Sesión iniciada correctamente. Rol: ${row.system_role}.`, ip);
        res.json({ success: true, user: userResponse, token });
    });
});

// ============================================================
// POST /logout — Revocar token JWT activo (blacklist)
// ============================================================
router.post('/logout', authenticateJWT, (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const token = req.token;
    const decoded = req.user;

    // Agregar token a la blacklist hasta que expire naturalmente
    revokeToken(token, decoded.exp);

    db.logAudit(decoded.id, 'CIERRE_SESION', `Sesión cerrada y token revocado. Usuario: ${decoded.username}.`, ip);

    res.json({ success: true, message: 'Sesión cerrada correctamente.' });
});

module.exports = router;
