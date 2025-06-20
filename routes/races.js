const express = require('express');
const router = express.Router();
const Race = require('../models/Race');
const auth = require('../middleware/auth'); // Importa el middleware de autenticación

// @route   POST /api/races
// @desc    Crear una nueva carrera (solo admin o carga inicial)
// @access  Private (requiere autenticación, luego podrías añadir rol de admin)
router.post('/', auth, async (req, res) => {
    const { name, location, date, season, round } = req.body;

    try {
        const newRace = new Race({
            name,
            location,
            date,
            season,
            round
        });
        const race = await newRace.save();
        res.status(201).json(race);
    } catch (err) {
        console.error(err.message);
        // Manejo de errores para duplicados (ej: unique: true en name)
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Ya existe una carrera con ese nombre.' });
        }
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/races
// @desc    Obtener todas las carreras
// @access  Public
router.get('/', async (req, res) => {
    try {
        const races = await Race.find().sort({ date: 1 }); // Ordenar por fecha ascendente
        res.json(races);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/races/:id
// @desc    Obtener una carrera por ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const race = await Race.findById(req.params.id);
        if (!race) {
            return res.status(404).json({ msg: 'Carrera no encontrada' });
        }
        res.json(race);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') { // Maneja IDs inválidos de MongoDB
            return res.status(404).json({ msg: 'Carrera no encontrada' });
        }
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/races/:id
// @desc    Actualizar una carrera (ej: cambiar isPredictionOpen, isRaceCompleted)
// @access  Private (requiere autenticación)
router.put('/:id', auth, async (req, res) => {
    const { name, location, date, isPredictionOpen, isRaceCompleted, season, round } = req.body;

    try {
        let race = await Race.findById(req.params.id);
        if (!race) {
            return res.status(404).json({ msg: 'Carrera no encontrada' });
        }

        // Actualizar campos
        race.name = name || race.name;
        race.location = location || race.location;
        race.date = date || race.date;
        race.isPredictionOpen = (typeof isPredictionOpen === 'boolean') ? isPredictionOpen : race.isPredictionOpen;
        race.isRaceCompleted = (typeof isRaceCompleted === 'boolean') ? isRaceCompleted : race.isRaceCompleted;
        race.season = season || race.season;
        race.round = round || race.round;

        await race.save();
        res.json(race);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Carrera no encontrada' });
        }
        res.status(500).send('Error del servidor');
    }
});

// Puedes añadir una ruta DELETE /api/races/:id si necesitas eliminar carreras.

module.exports = router;