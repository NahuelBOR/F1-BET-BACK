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

// @route   PUT /api/users/profile
// @desc    Actualizar el perfil del usuario (ej. cambiar el tema preferido)
// @access  Private (solo el propio usuario)
router.put('/profile', auth, async (req, res) => {
    try {
        const userId = req.user.id; // ID del usuario autenticado
        const { preferredTeamTheme } = req.body;
        
        

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }

        // Solo permitir actualizar preferredTeamTheme por ahora
        if (preferredTeamTheme !== undefined) {
            user.preferredTeamTheme = preferredTeamTheme;
        }

        await user.save();

        // Devolver solo los datos actualizados que no sean sensibles
        res.json({
            msg: 'Perfil actualizado exitosamente.',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                totalScore: user.totalScore,
                isAdmin: user.isAdmin,
                profilePicture: user.profilePicture,
                preferredTeamTheme: user.preferredTeamTheme,
                createdAt: user.createdAt
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor al actualizar el perfil.');
    }
});

module.exports = router;