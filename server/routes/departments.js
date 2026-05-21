const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');

// GET all departments
router.get('/', authenticateJWT, (req, res) => {
    const query = `
        SELECT d.*, u.name as manager_name 
        FROM departments d
        LEFT JOIN users u ON d.manager_id = u.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al obtener departamentos: ' + err.message });
        res.json(rows);
    });
});

// POST new department
router.post('/', authenticateJWT, requireRole(['Administrador']), (req, res) => {
    const { name, description, manager_id } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre del departamento es requerido.' });

    db.run("INSERT INTO departments (name, description, manager_id) VALUES (?, ?, ?)", 
    [name, description, manager_id || null], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Ya existe un departamento con ese nombre.' });
            }
            return res.status(500).json({ error: 'Error al registrar departamento: ' + err.message });
        }
        res.json({ id: this.lastID, name, description, manager_id });
    });
});

// PUT update department
router.put('/:id', authenticateJWT, requireRole(['Administrador']), (req, res) => {
    const { name, description, manager_id } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre del departamento es requerido.' });

    db.run("UPDATE departments SET name = ?, description = ?, manager_id = ? WHERE id = ?", 
    [name, description, manager_id || null, req.params.id], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Ya existe un departamento con ese nombre.' });
            }
            return res.status(500).json({ error: 'Error al actualizar departamento: ' + err.message });
        }
        res.json({ success: true, changes: this.changes });
    });
});

// DELETE department
router.delete('/:id', authenticateJWT, requireRole(['Administrador']), (req, res) => {
    db.run("DELETE FROM departments WHERE id = ?", [req.params.id], function(err) {
        if (err) {
            if (err.message.includes('FOREIGN KEY constraint failed')) {
                return res.status(400).json({ error: 'No se puede eliminar el departamento porque tiene cargos vinculados.' });
            }
            return res.status(500).json({ error: 'Error al eliminar departamento: ' + err.message });
        }
        res.json({ success: true, changes: this.changes });
    });
});

module.exports = router;

