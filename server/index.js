const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const bodyParser = require('body-parser');
const db = require('./database');

// Importar Enrutadores Modulares
const authRouter = require('./routes/auth');
const departmentsRouter = require('./routes/departments');
const positionsRouter = require('./routes/positions');
const usersRouter = require('./routes/users');
const dispatchesRouter = require('./routes/dispatches');
const productTypesRouter = require('./routes/productTypes');
const clientsRouter = require('./routes/clients');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares Globales
app.use(cors());
app.use(compression()); // Compresión GZIP para optimizar transferencia de red (JSON pesado)
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev')); // Solo registrar logs en consola durante desarrollo para evitar bloquear el event loop
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

// Ruta de compatibilidad para peticiones directas de login antiguo
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
        rows.forEach(row => {
            if (row.status === 'Activo') active = row.count;
            if (row.status === 'Inactivo') inactive = row.count;
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

// Middleware 404 para rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({ error: 'La ruta solicitada no existe en el servidor.' });
});

// Middleware de error global
app.use((err, req, res, next) => {
    console.error('❌ ERROR CRÍTICO CAPTURADO:', err.stack || err.message || err);
    res.status(500).json({ 
        error: 'Ha ocurrido un problema interno en el servidor. La operación no pudo completarse.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corporativo ejecutándose en el puerto ${PORT}`);
});
