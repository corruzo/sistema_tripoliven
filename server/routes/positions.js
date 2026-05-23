const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');

// GET all positions
router.get('/', authenticateJWT, (req, res) => {
    const query = `
        SELECT p.*, d.name as department_name 
        FROM positions p 
        LEFT JOIN departments d ON p.department_id = d.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener cargos:', err);
            return res.status(500).json({ error: 'Error al obtener cargos.' });
        }
        res.json(rows);
    });
});

// POST new position
router.post('/', authenticateJWT, requireRole(['Administrador']), (req, res) => {
    const { name, department_id, description } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre del cargo es requerido.' });
    if (!department_id) return res.status(400).json({ error: 'El departamento es requerido.' });

    db.run("INSERT INTO positions (name, department_id, description) VALUES (?, ?, ?)", 
    [name, department_id, description], function(err) {
        if (err) {
            console.error('Error al registrar cargo:', err);
            return res.status(500).json({ error: 'Error al registrar cargo.' });
        }
        res.json({ id: this.lastID, name, department_id, description });
    });
});

// PUT update position
router.put('/:id', authenticateJWT, requireRole(['Administrador']), (req, res) => {
    const { name, department_id, description } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre del cargo es requerido.' });
    if (!department_id) return res.status(400).json({ error: 'El departamento es requerido.' });

    db.run("UPDATE positions SET name = ?, department_id = ?, description = ? WHERE id = ?", 
    [name, department_id, description, req.params.id], function(err) {
        if (err) {
            console.error('Error al actualizar cargo:', err);
            return res.status(500).json({ error: 'Error al actualizar cargo.' });
        }
        res.json({ success: true, changes: this.changes });
    });
});

// DELETE position
router.delete('/:id', authenticateJWT, requireRole(['Administrador']), (req, res) => {
    db.run("DELETE FROM positions WHERE id = ?", [req.params.id], function(err) {
        if (err) {
            if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
                return res.status(400).json({ error: 'No se puede eliminar el cargo porque tiene usuarios vinculados.' });
            }
            console.error('Error al eliminar cargo:', err);
            return res.status(500).json({ error: 'Error al eliminar cargo.' });
        }
        res.json({ success: true, changes: this.changes });
    });
});

module.exports = router;
