const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../database');

// ----------------------------------------------------
// 1. OBTENER BITÁCORA DE AUDITORÍA (PAGINADA Y FILTRADA)
// ----------------------------------------------------
router.get('/audit-logs', (req, res, next) => {
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
        whereClause = ` WHERE a.action LIKE ? OR a.details LIKE ? OR u.name LIKE ? OR u.username LIKE ? OR a.ip_address LIKE ?`;
        const wildSearch = `%${search}%`;
        queryParams = [wildSearch, wildSearch, wildSearch, wildSearch, wildSearch];
    }
    
    db.get(countQuery + whereClause, queryParams, (err, row) => {
        if (err) return next(err);
        const total = row ? row.count : 0;
        
        const dataParams = [...queryParams];
        const selectQuery = dataQuery + whereClause + ` ORDER BY a.createdAt DESC LIMIT ? OFFSET ?`;
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

// ----------------------------------------------------
// 2. DESCARGAR RESPALDO DE BASE DE DATOS (.sqlite)
// ----------------------------------------------------
router.get('/backup', (req, res) => {
    const dbFolder = process.env.NODE_ENV === 'production' 
        ? path.resolve(__dirname, '../database') 
        : path.resolve(__dirname, '..');
    const dbPath = path.resolve(dbFolder, 'database.sqlite');
    
    if (!fs.existsSync(dbPath)) {
        return res.status(404).json({ error: 'Archivo de base de datos no encontrado.' });
    }
    
    const dateStr = new Date().toISOString().split('T')[0];
    res.download(dbPath, `respaldo_tripoliven_${dateStr}.sqlite`, (err) => {
        if (err) {
            console.error('Error al descargar el respaldo:', err.message);
        } else {
            // Registrar acción en la bitácora de auditoría
            const userId = req.headers['x-user-id'] || null;
            const ip = req.ip || req.connection.remoteAddress;
            db.logAudit(userId, 'RESPALDO_DESCARGADO', 'Respaldo completo de la base de datos descargado por el administrador.', ip);
        }
    });
});

// ----------------------------------------------------
// 3. OPTIMIZAR BASE DE DATOS (VACUUM)
// ----------------------------------------------------
router.post('/backup/optimize', (req, res, next) => {
    const userId = req.headers['x-user-id'] || null;
    const ip = req.ip || req.connection.remoteAddress;

    db.run("VACUUM", [], (err) => {
        if (err) {
            console.error('Error al optimizar la base de datos:', err.message);
            return next(err);
        }
        
        db.logAudit(userId, 'BASE_DATOS_OPTIMIZADA', 'Se ejecutó el comando VACUUM de mantenimiento y desfragmentación.', ip)
            .then(() => {
                res.json({ success: true, message: 'Base de datos desfragmentada y optimizada con éxito.' });
            })
            .catch(next);
    });
});

// ----------------------------------------------------
// 4. RESTAURAR BASE DE DATOS (SUBIDA BINARIA DIRECTA)
// ----------------------------------------------------
router.post('/backup/restore', (req, res) => {
    const userId = req.headers['x-user-id'] || null;
    const ip = req.ip || req.connection.remoteAddress;
    
    const dbFolder = process.env.NODE_ENV === 'production' 
        ? path.resolve(__dirname, '../database') 
        : path.resolve(__dirname, '..');
    const activePath = path.resolve(dbFolder, 'database.sqlite');
    const tempPath = path.resolve(dbFolder, 'database.sqlite.tmp');
    const backupPath = path.resolve(dbFolder, 'database.sqlite.bak');
    
    const writeStream = fs.createWriteStream(tempPath);
    req.pipe(writeStream);
    
    writeStream.on('finish', () => {
        try {
            // Verificar firma de archivo SQLite ("SQLite format 3\0")
            const fd = fs.openSync(tempPath, 'r');
            const buffer = Buffer.alloc(16);
            fs.readSync(fd, buffer, 0, 16, 0);
            fs.closeSync(fd);
            
            if (buffer.toString() !== 'SQLite format 3\0') {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                return res.status(400).json({ error: 'El archivo subido no es una base de datos SQLite válida.' });
            }
            
            // Cerrar conexión activa a la base de datos
            db.close((err) => {
                if (err) {
                    console.error('Error al cerrar base de datos activa:', err.message);
                    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                    return res.status(500).json({ error: 'No se pudo cerrar la base de datos para restaurar.' });
                }
                
                try {
                    // Respaldar la base de datos actual antes de sobrescribir
                    if (fs.existsSync(activePath)) {
                        fs.copyFileSync(activePath, backupPath);
                    }
                    
                    // Reemplazar la base de datos por la restaurada
                    fs.copyFileSync(tempPath, activePath);
                    fs.unlinkSync(tempPath);
                    
                    // Responder éxito
                    res.json({ 
                        success: true, 
                        message: 'Base de datos restaurada correctamente. El sistema se reiniciará en un segundo para aplicar los cambios.' 
                    });
                    
                    // Salir del proceso para que el manejador de reinicio cargue el nuevo archivo
                    setTimeout(() => {
                        console.log('Reiniciando servidor de despachos tras restauración de respaldo...');
                        process.exit(0);
                    }, 1000);
                } catch (copyErr) {
                    console.error('Error al sobrescribir archivo de base de datos:', copyErr.message);
                    res.status(500).json({ error: 'Fallo al mover la base de datos restaurada a su ubicación activa.' });
                }
            });
        } catch (e) {
            console.error('Error de validación al restaurar:', e.message);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            res.status(500).json({ error: 'Error al verificar la estructura del archivo SQLite.' });
        }
    });
    
    writeStream.on('error', (err) => {
        console.error('Fallo al recibir el flujo de base de datos:', err.message);
        res.status(500).json({ error: 'Fallo al escribir el flujo de la base de datos temporal.' });
    });
});

module.exports = router;
