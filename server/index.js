require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./database');

// Importar Enrutadores Modulares
const authRouter = require('./routes/auth');
const departmentsRouter = require('./routes/departments');
const positionsRouter = require('./routes/positions');
const usersRouter = require('./routes/users');
const dispatchesRouter = require('./routes/dispatches');
const productTypesRouter = require('./routes/productTypes');
const clientsRouter = require('./routes/clients');
const systemRouter = require('./routes/system');

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =======================
// HELMET — Cabeceras de seguridad HTTP
// Protege contra clickjacking, XSS, sniffing de MIME, etc.
// =======================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Requerido para estilos inline de React
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"], // Equivale a X-Frame-Options: DENY
        }
    },
    crossOriginEmbedderPolicy: false // Desactivar para compatibilidad con Electron
}));

// =======================
// CORS — Política de orígenes permitidos
// Producción: solo orígenes explícitos de ALLOWED_ORIGINS
// Desarrollo: loopback, LAN privada (RFC1918) y Electron
// =======================
let allowedOrigins;

if (NODE_ENV === 'production') {
    // En producción, cargar orígenes desde variable de entorno (lista separada por comas)
    // Ejemplo: ALLOWED_ORIGINS=http://192.168.1.100:3000,http://erp.tripoliven.local
    const originsEnv = process.env.ALLOWED_ORIGINS || '';
    allowedOrigins = originsEnv.split(',').map(o => o.trim()).filter(Boolean);

    if (allowedOrigins.length === 0) {
        console.warn('⚠️  [CORS] NODE_ENV=production pero ALLOWED_ORIGINS no está definida. CORS rechazará todas las solicitudes externas.');
    }
}

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir solicitudes sin origen: Electron, apps nativas, curl en LAN
        if (!origin) return callback(null, true);

        if (NODE_ENV === 'production') {
            // Producción: solo orígenes explícitamente permitidos
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Acceso denegado por política CORS de Tripoliven.'));
            }
        } else {
            // Desarrollo: loopback local, file://, app:// o bloques de red privada LAN (RFC 1918)
            const isLocal =
                origin.startsWith('http://localhost') ||
                origin.startsWith('http://127.0.0.1') ||
                origin.startsWith('file://') ||
                origin.startsWith('app://') ||
                /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);

            if (isLocal) {
                callback(null, true);
            } else {
                callback(new Error('Acceso denegado por política CORS de Tripoliven.'));
            }
        }
    },
    credentials: true
};
app.use(cors(corsOptions));

// =======================
// RATE LIMITING — Protección contra fuerza bruta en login
// Máximo 10 intentos por IP cada 15 minutos
// =======================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,                   // Máximo 10 intentos por ventana
    standardHeaders: true,     // Incluir cabeceras RateLimit-* estándar
    legacyHeaders: false,
    message: {
        error: 'Demasiados intentos de inicio de sesión desde esta dirección. Por seguridad, intenta de nuevo en 15 minutos.'
    },
    handler: (req, res, next, options) => {
        const ip = req.ip || req.connection.remoteAddress;
        console.warn(`⚠️  [RATE LIMIT] IP bloqueada por exceso de intentos de login: ${ip}`);
        res.status(429).json(options.message);
    }
});

// Aplicar rate limiting solo al endpoint de login
app.use('/api/auth/login', loginLimiter);

// =======================
// MIDDLEWARES GLOBALES
// =======================
app.use(compression()); // Compresión GZIP para optimizar transferencia de red
if (NODE_ENV !== 'production') {
    app.use(morgan('dev')); // Logs solo en desarrollo
}
app.use(bodyParser.json());

// Montar Rutas de la API
app.use('/api/auth', authRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/positions', positionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/dispatches', dispatchesRouter);
app.use('/api/product-types', productTypesRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/system', systemRouter);

// Ruta de comprobación de salud del servidor (Health Check) súper ligera
app.get('/api/health', (req, res) => {
    res.json({ status: "ok" });
});

// Ruta de compatibilidad para clientes antiguos (login heredado)
app.post('/api/login', (req, res, next) => {
    req.url = '/login';
    authRouter(req, res, next);
});

// =======================
// ESTADÍSTICAS DEL PANEL (DASHBOARD STATS)
// =======================
app.get('/api/dashboard/stats', (req, res, next) => {
    db.all("SELECT status, count(*) as count FROM users GROUP BY status", [], (err, rows) => {
        if (err) return next(err);

        let active = 0;
        let inactive = 0;
        const statsRows = rows || [];
        statsRows.forEach(row => {
            if (row) {
                const countVal = parseInt(row.count, 10) || 0;
                if (row.status === 'Activo') active = countVal;
                if (row.status === 'Inactivo') inactive = countVal;
            }
        });

        res.json({
            totalUsers: active + inactive,
            activeUsers: active,
            inactiveUsers: inactive,
            systemStatus: 'En Línea'
        });
    });
});

// =======================
// HORA DEL SERVIDOR (fuente de verdad para todos los clientes)
// =======================
app.get('/api/server-time', (req, res) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const offsetMin = -now.getTimezoneOffset();
    const offsetSign = offsetMin >= 0 ? '+' : '-';
    const offsetHH = pad(Math.floor(Math.abs(offsetMin) / 60));
    const offsetMM = pad(Math.abs(offsetMin) % 60);
    res.json({
        date,
        time,
        datetime: `${date}T${time}`,
        timezone: `UTC${offsetSign}${offsetHH}:${offsetMM}`
    });
});

// =======================
// MANEJO DE ERRORES GLOBAL (BLINDAJE CONTRA CAÍDAS)
// =======================

// Blindaje de proceso a nivel de sistema operativo para asegurar disponibilidad del 100% (Nunca Cae)
const fs = require('fs');
const path = require('path');
const logCrash = (errorType, err) => {
    const errorMsg = `[${new Date().toISOString()}] 🚨 ERROR CRÍTICO CAPTURADO (${errorType}):\n${err.stack || err.message || err}\n\n`;
    console.error(errorMsg);
    try {
        fs.appendFileSync(path.resolve(__dirname, 'crashes.log'), errorMsg, 'utf8');
    } catch (e) {
        console.error('No se pudo escribir en crashes.log:', e.message);
    }
};

process.on('uncaughtException', (err) => {
    logCrash('Uncaught Exception', err);
    process.exit(1); // Finalizar de forma limpia para evitar un estado zombi inconsistente
});

process.on('unhandledRejection', (reason, promise) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logCrash('Unhandled Rejection', err);
    process.exit(1); // Finalizar de forma limpia para evitar un estado zombi inconsistente
});

// Middleware 404 para rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({ error: 'La ruta solicitada no existe en el servidor.' });
});

// Middleware de error global
app.use((err, req, res, next) => {
    logCrash('Express Middleware Error', err);
    res.status(500).json({
        error: 'Ha ocurrido un problema interno en el servidor. La operación no pudo completarse.',
        details: NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corporativo ejecutándose en el puerto ${PORT} [${NODE_ENV}]`);
});
