const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all product types
router.get('/', (req, res) => {
    db.all("SELECT * FROM product_types ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al obtener tipos de producto: ' + err.message });
        res.json(rows);
    });
});

// POST register a new product type
router.post('/', (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'El nombre del tipo de producto es obligatorio.' });
    }

    const query = "INSERT INTO product_types (name, description) VALUES (?, ?)";
    db.run(query, [name.trim(), description || null], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Este tipo de producto ya se encuentra registrado.' });
            }
            return res.status(500).json({ error: 'Error al registrar el tipo de producto: ' + err.message });
        }
        res.json({ id: this.lastID, name: name.trim(), description });
    });
});

// PUT update a product type
router.put('/:id', (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'El nombre del tipo de producto es obligatorio.' });
    }

    const query = "UPDATE product_types SET name = ?, description = ? WHERE id = ?";
    db.run(query, [name.trim(), description || null, req.params.id], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Ya existe otro tipo de producto con ese nombre.' });
            }
            return res.status(500).json({ error: 'Error al actualizar el tipo de producto: ' + err.message });
        }
        res.json({ success: true, id: req.params.id, name: name.trim(), description });
    });
});

// DELETE a product type
router.delete('/:id', (req, res) => {
    db.run("DELETE FROM product_types WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Error al eliminar el tipo de producto: ' + err.message });
        res.json({ success: true, changes: this.changes });
    });
});

module.exports = router;
