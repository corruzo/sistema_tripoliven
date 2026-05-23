const jwt = require('jsonwebtoken');

// ============================================================
// JWT_SECRET — DEBE venir exclusivamente de variables de entorno
// Si no está definida, el servidor no arranca (fail-fast seguro)
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ [SEGURIDAD CRÍTICA] La variable de entorno JWT_SECRET no está definida.');
    console.error('   Define JWT_SECRET en el archivo server/.env antes de iniciar el servidor.');
    process.exit(1);
}

// ============================================================
// BLACKLIST DE TOKENS (en memoria del proceso Node.js)
// Tokens que han sido explícitamente revocados al cerrar sesión.
// Nota: Se limpia al reiniciar el servidor. Para producción con
// alta disponibilidad, migrar a Redis.
// ============================================================
const revokedTokens = new Set();

/**
 * Agrega un token JWT a la blacklist de tokens revocados.
 * @param {string} token - El token JWT a revocar
 * @param {number} exp - Timestamp de expiración del token (Unix epoch en segundos)
 */
function revokeToken(token, exp) {
    revokedTokens.add(token);

    // Limpiar automáticamente el token de la blacklist cuando expire
    // para evitar que el Set crezca indefinidamente
    if (exp) {
        const msUntilExpiry = (exp * 1000) - Date.now();
        if (msUntilExpiry > 0) {
            setTimeout(() => revokedTokens.delete(token), msUntilExpiry);
        }
    }
}

/**
 * Comprueba si un token JWT está en la blacklist.
 * @param {string} token
 * @returns {boolean}
 */
function isTokenRevoked(token) {
    return revokedTokens.has(token);
}

// ============================================================
// MIDDLEWARE: Verificar autenticación JWT
// ============================================================
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Acceso denegado. Se requiere un token de sesión activo.' });
    }

    // Formato estándar: Bearer <TOKEN>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
        return res.status(401).json({ error: 'Acceso denegado. Formato de token inválido.' });
    }

    const token = parts[1];

    // Verificar si el token fue revocado (logout explícito)
    if (isTokenRevoked(token)) {
        return res.status(401).json({ error: 'Token revocado. La sesión fue cerrada. Inicia sesión de nuevo.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado. Acceso denegado.' });
        }
        req.user = decoded; // Guarda el usuario decodificado (id, username, system_role) en req.user
        req.token = token;  // Guarda el token crudo para poder revocarlo en el logout
        next();
    });
};

// ============================================================
// MIDDLEWARE: Verificar rol de usuario
// ============================================================
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Acceso denegado. Usuario no autenticado.' });
        }

        if (allowedRoles.includes(req.user.system_role)) {
            next();
        } else {
            return res.status(403).json({ error: `Acceso restringido. Se requiere rol de: ${allowedRoles.join(' o ')}.` });
        }
    };
};

module.exports = {
    authenticateJWT,
    requireRole,
    revokeToken,
    isTokenRevoked,
    JWT_SECRET
};
