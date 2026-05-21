const jwt = require('jsonwebtoken');

// Clave secreta fija para la firma de tokens en la planta corporativa
// En producción, lo ideal es usar una variable de entorno JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'tripoliven_secret_key_de_alta_seguridad_2026';

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        // Formato estándar: Bearer <TOKEN>
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Acceso denegado. Formato de token inválido.' });
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Token inválido o expirado. Acceso denegado.' });
            }
            req.user = user; // Guarda el usuario decodificado (id, username, system_role) en req.user
            next();
        });
    } else {
        return res.status(401).json({ error: 'Acceso denegado. Se requiere un token de sesión activo.' });
    }
};

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
    JWT_SECRET
};
