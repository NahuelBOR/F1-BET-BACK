const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth'); // Importa el middleware de autenticación

// @route   GET /api/users/ranking
// @desc    Obtener el ranking global de usuarios por puntaje total
// @access  Public
router.get('/ranking', async (req, res) => {
    try {
        // Ordena a los usuarios por totalScore de forma descendente
        const ranking = await User.find().sort({ totalScore: -1 }).select('-password -email -createdAt'); // Excluye info sensible
        res.json(ranking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/users/:id
// @desc    Obtener el perfil de un usuario específico (sin contraseña)
// @access  Public (podría ser privado si solo los admins pueden ver detalles)
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;