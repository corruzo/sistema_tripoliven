const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const db = require('../database');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');

// Reutilizar el pool de conexión de Postgres desde las variables de entorno
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'tripoliven_admin',
    password: process.env.DB_PASSWORD || 'tripoliven_secure_pwd_2026',
    database: process.env.DB_NAME || 'tripoliven_db'
});

// ============================================================
// UTILIDADES INTERNAS: GENERACIÓN Y RESTAURACIÓN DE DUMP SQL
// ============================================================

/**
 * Tablas del sistema en orden de inserción segura (respetando FK)
 */
const ORDERED_TABLES = [
    'departments',
    'positions',
    'users',
    'product_types',
    'clients',
    'dispatches',
    'audit_logs'
];

/**
 * Genera un dump SQL completo de la base de datos desde el pool.
 * Exporta DDL simplificado y todos los datos como INSERTs portables.
 * @returns {Promise<string>} - Cadena de texto con el SQL dump completo
 */
async function generateSqlDump() {
    const lines = [];
    const ts = new Date().toISOString();

    lines.push(`-- ============================================================`);
    lines.push(`-- RESPALDO TRIPOLIVEN ERP - Generado: ${ts}`);
    lines.push(`-- Motor: PostgreSQL | Sistema: Tripoliven Logística`);
    lines.push(`-- ============================================================`);
    lines.push('');
    lines.push('SET session_replication_role = replica; -- Deshabilitar FK temporalmente');
    lines.push('');

    for (const table of ORDERED_TABLES) {
        try {
            const result = await pool.query(`SELECT * FROM ${table} ORDER BY id`);
            if (result.rows.length === 0) {
                lines.push(`-- Tabla: ${table} (sin datos)`);
                lines.push('');
                continue;
            }

            lines.push(`-- ============================================================`);
            lines.push(`-- Tabla: ${table} | Filas: ${result.rows.length}`);
            lines.push(`-- ============================================================`);
            lines.push(`DELETE FROM ${table};`);

            for (const row of result.rows) {
                const columns = Object.keys(row).map(c => `"${c}"`).join(', ');
                const values = Object.values(row).map(v => {
                    if (v === null) return 'NULL';
                    if (typeof v === 'number') return v;
                    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
                    // Escapar comillas simples en strings
                    return `'${String(v).replace(/'/g, "''")}'`;
                }).join(', ');
                lines.push(`INSERT INTO ${table} (${columns}) VALUES (${values});`);
            }

            // Restaurar la secuencia SERIAL después de insertar datos con IDs explícitos
            lines.push(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 1)) FROM ${table};`);
            lines.push('');
        } catch (err) {
            // Tabla puede no existir aún; continuar sin abortar el dump
            lines.push(`-- ADVERTENCIA: No se pudo exportar la tabla "${table}": ${err.message}`);
            lines.push('');
        }
    }

    lines.push('SET session_replication_role = DEFAULT; -- Re-habilitar FK');
    lines.push('');
    lines.push(`-- Fin del respaldo - ${ts}`);

    return lines.join('\n');
}

/**
 * Ejecuta un dump SQL importado contra el pool de PostgreSQL.
 * Divide el contenido por sentencias, filtrando comentarios y líneas vacías.
 * @param {string} sqlContent - Contenido del archivo .sql a restaurar
 * @returns {Promise<{executed: number, errors: string[]}>}
 */
async function executeSqlDump(sqlContent) {
    const client = await pool.connect();
    const errors = [];
    let executed = 0;

    try {
        await client.query('BEGIN');

        // Dividir por punto y coma, limpiar y filtrar sentencias vacías
        const statements = sqlContent
            .split(/;(\s*\n|$)/)
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const stmt of statements) {
            try {
                await client.query(stmt);
                executed++;
            } catch (err) {
                // Errores no-críticos se registran pero no abortan la restauración
                errors.push(`Sentencia ignorada: ${err.message.substring(0, 120)}`);
            }
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Fallo crítico en la transacción de restauración: ${err.message}`);
    } finally {
        client.release();
    }

    return { executed, errors };
}

// ============================================================
// 1. OBTENER BITÁCORA DE AUDITORÍA (PAGINADA Y FILTRADA)
// ============================================================
router.get('/audit-logs', authenticateJWT, requireRole(['Administrador']), (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let queryParams = [];
    let countQuery = `SELECT COUNT(*) as count FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id`;
    let dataQuery = `
        SELECT a.*, u.name as user_name, u.username as user_username
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
    `;

    let whereClause = '';
    if (search) {
        // Usar ILIKE para búsqueda case-insensitive en PostgreSQL (en lugar de LIKE de SQLite)
        whereClause = ` WHERE a.action ILIKE $1 OR a.details ILIKE $2 OR u.name ILIKE $3 OR u.username ILIKE $4 OR a.ip_address ILIKE $5`;
        const wildSearch = `%${search}%`;
        queryParams = [wildSearch, wildSearch, wildSearch, wildSearch, wildSearch];
    }

    db.get(countQuery + whereClause, queryParams, (err, row) => {
        if (err) return next(err);
        const total = row ? parseInt(row.count) : 0;

        const dataParams = [...queryParams];
        // Parámetros posicionales de LIMIT/OFFSET: ajustar el índice según los parámetros de búsqueda previos
        const limitIndex = queryParams.length + 1;
        const offsetIndex = queryParams.length + 2;
        const selectQuery = dataQuery + whereClause + ` ORDER BY a.createdAt DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
        dataParams.push(limit, offset);

        db.all(selectQuery, dataParams, (err, rows) => {
            if (err) return next(err);
            res.json({
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                logs: rows
            });
        });
    });
});

// ============================================================
// 2. DESCARGAR RESPALDO DE BASE DE DATOS (SQL DUMP PORTÁTIL)
// ============================================================
router.get('/backup', authenticateJWT, requireRole(['Administrador']), async (req, res) => {
    const userId = req.user.id;
    const ip = req.ip || req.connection.remoteAddress;

    try {
        const sqlDump = await generateSqlDump();

        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `respaldo_tripoliven_${dateStr}.sql`;

        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(sqlDump);

        // Registrar acción en bitácora de auditoría segura
        await db.logAudit(
            userId,
            'RESPALDO_DESCARGADO',
            `Respaldo SQL completo descargado (${ORDERED_TABLES.length} tablas). Archivo: ${filename}`,
            ip
        );
    } catch (err) {
        console.error('❌ [BACKUP] Error al generar el respaldo SQL:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno al generar el respaldo de base de datos.' });
        }
    }
});

// ============================================================
// 3. OPTIMIZAR BASE DE DATOS (VACUUM ANALYZE EN POSTGRESQL)
// ============================================================
router.post('/backup/optimize', authenticateJWT, requireRole(['Administrador']), async (req, res, next) => {
    const userId = req.user.id;
    const ip = req.ip || req.connection.remoteAddress;

    try {
        // VACUUM ANALYZE actualiza estadísticas del planner y recupera espacio en disco
        // Debe ejecutarse fuera de una transacción explícita
        await pool.query('VACUUM ANALYZE');

        await db.logAudit(
            userId,
            'BASE_DATOS_OPTIMIZADA',
            'Se ejecutó VACUUM ANALYZE en PostgreSQL: estadísticas de query planner actualizadas y espacio recuperado.',
            ip
        );

        res.json({
            success: true,
            message: 'Base de datos optimizada con éxito. Estadísticas del planificador de consultas actualizadas (VACUUM ANALYZE).'
        });
    } catch (err) {
        console.error('❌ [OPTIMIZE] Error al optimizar la base de datos:', err.message);
        next(err);
    }
});

// ============================================================
// 4. RESTAURAR BASE DE DATOS (SQL DUMP - ZERO DOWNTIME)
// ============================================================
router.post('/backup/restore', authenticateJWT, requireRole(['Administrador']), async (req, res) => {
    const userId = req.user.id;
    const ip = req.ip || req.connection.remoteAddress;

    // Validar Content-Type antes de leer el cuerpo
    // Solo se aceptan tipos de contenido explícitamente permitidos para archivos SQL
    const contentType = (req.headers['content-type'] || '').toLowerCase().split(';')[0].trim();
    const allowedTypes = ['text/plain', 'application/sql', 'application/octet-stream'];
    if (!allowedTypes.includes(contentType)) {
        return res.status(415).json({
            error: `Tipo de contenido no permitido: "${contentType}". El archivo debe enviarse como text/plain o application/sql.`
        });
    }

    try {
        // Leer el cuerpo del request como texto plano (el dump SQL)
        let sqlContent = '';
        await new Promise((resolve, reject) => {
            req.setEncoding('utf8');
            req.on('data', chunk => { sqlContent += chunk; });
            req.on('end', resolve);
            req.on('error', reject);
        });

        if (!sqlContent || sqlContent.trim().length === 0) {
            return res.status(400).json({ error: 'El archivo SQL de restauración está vacío o no fue enviado.' });
        }

        // Validar que el archivo tenga la firma del respaldo de Tripoliven
        if (!sqlContent.includes('RESPALDO TRIPOLIVEN ERP')) {
            return res.status(400).json({
                error: 'El archivo subido no es un respaldo válido del Sistema Tripoliven. Verifica que sea un archivo .sql generado por este sistema.'
            });
        }

        // Ejecutar el dump SQL con Zero Downtime (sin reiniciar Node.js)
        const { executed, errors } = await executeSqlDump(sqlContent);

        await db.logAudit(
            userId,
            'RESPALDO_RESTAURADO',
            `Base de datos restaurada desde dump SQL. Sentencias ejecutadas: ${executed}. Errores menores: ${errors.length}.`,
            ip
        );

        res.json({
            success: true,
            message: `Base de datos restaurada correctamente. ${executed} sentencias ejecutadas sin necesidad de reiniciar el servidor.`,
            warnings: errors.length > 0 ? errors.slice(0, 10) : undefined
        });

    } catch (err) {
        console.error('❌ [RESTORE] Error al restaurar el respaldo:', err);
        res.status(500).json({
            error: 'Error interno durante la restauración de la base de datos.'
        });
    }
});

module.exports = router;
