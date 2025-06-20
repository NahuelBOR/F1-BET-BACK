const express = require('express');
const router = express.Router();
const Prediction = require('../models/Prediction');
const Race = require('../models/Race');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth'); 
const User = require('../models/User');

// @route   POST /api/predictions
// @desc    Crear o actualizar una predicción para una carrera
// @access  Private
router.post('/', auth, async (req, res) => {
    const { raceId, predictedWinner, predictedSecond, predictedThird } = req.body;
    const userId = req.user.id; // ID del usuario autenticado

    try {
        // Verificar si la carrera existe y si las predicciones están abiertas
        const race = await Race.findById(raceId);
        if (!race) {
            return res.status(404).json({ msg: 'Carrera no encontrada' });
        }
        // Validar si la fecha actual es posterior a la fecha de la carrera para cerrar predicciones
        if (new Date() > race.date || !race.isPredictionOpen) {
            return res.status(400).json({ msg: 'Las predicciones para esta carrera ya están cerradas.' });
        }

        // Buscar si ya existe una predicción para este usuario y esta carrera
        let prediction = await Prediction.findOne({ user: userId, race: raceId });

        if (prediction) {
            // Si existe, actualizarla
            prediction.predictedWinner = predictedWinner;
            prediction.predictedSecond = predictedSecond;
            prediction.predictedThird = predictedThird;
            await prediction.save();
            return res.json({ msg: 'Predicción actualizada exitosamente', prediction });
        } else {
            // Si no existe, crear una nueva
            prediction = new Prediction({
                user: userId,
                race: raceId,
                predictedWinner,
                predictedSecond,
                predictedThird
            });
            await prediction.save();
            res.status(201).json({ msg: 'Predicción creada exitosamente', prediction });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/predictions/user/:userId
// @desc    Obtener todas las predicciones de un usuario específico
// @access  Private (requiere autenticación, y solo accesible por el propio usuario o por un administrador)
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const requestingUserId = req.user.id; // ID del usuario que hace la petición
        
        // Opcional: Obtener el usuario que hace la petición para verificar si es admin
        const requestingUser = await User.findById(requestingUserId);


        // Lógica de privacidad/administrador:
        // Solo permite ver las predicciones si:
        // 1. El ID del perfil solicitado es el mismo que el del usuario autenticado (ver sus propias predicciones)
        // O
        // 2. El usuario autenticado es un administrador.
        if (targetUserId !== requestingUserId && (!requestingUser || !requestingUser.isAdmin)) {
            return res.status(403).json({ msg: 'Acceso denegado: No tienes permiso para ver las predicciones de este usuario.' });
        }

        const predictions = await Prediction.find({ user: targetUserId })
            .populate('race', 'name date isRaceCompleted') // Incluye nombre, fecha y si la carrera está completada
            .sort({ createdAt: -1 }); // Las más recientes primero

        res.json(predictions);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'ID de usuario no válido.' });
        }
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/predictions/my-predictions
// @desc    Obtener todas las predicciones del usuario autenticado
// @access  Private
router.get('/my-predictions', auth, async (req, res) => {
    try {
        const predictions = await Prediction.find({ user: req.user.id })
            .populate('race', 'name date') // Incluye el nombre y fecha de la carrera
            .sort({ createdAt: -1 }); // Las más recientes primero
        res.json(predictions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/predictions/:raceId/my
// @desc    Obtener la predicción del usuario autenticado para una carrera específica
// @access  Private
router.get('/:raceId/my', auth, async (req, res) => {
    try {
        const prediction = await Prediction.findOne({ user: req.user.id, race: req.params.raceId })
            .populate('race', 'name date');
        if (!prediction) {
            return res.status(404).json({ msg: 'No se encontró predicción para esta carrera.' });
        }
        res.json(prediction);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'ID de carrera no válido.' });
        }
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;