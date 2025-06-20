const express = require('express');
const router = express.Router();
const RaceResult = require('../models/RaceResult');
const Race = require('../models/Race'); // Necesario para actualizar el estado de la carrera
const Prediction = require('../models/Prediction'); // Necesario para buscar predicciones
const User = require('../models/User'); // Necesario para actualizar puntajes de usuarios
const auth = require('../middleware/auth'); // Middleware de autenticación

// --- Endpoint para registrar resultados oficiales (SOLO ADMIN) ---
// @route   POST /api/race-results
// @desc    Registrar los resultados oficiales de una carrera
// @access  Private (requiere autenticación, luego añadirás un rol de admin)
router.post('/', auth, async (req, res) => {
    const { raceId, officialWinner, officialSecond, officialThird } = req.body;

    try {
        // 1. Verificar que la carrera exista
        const race = await Race.findById(raceId);
        if (!race) {
            return res.status(404).json({ msg: 'Carrera no encontrada.' });
        }

        // 2. Verificar si los resultados ya fueron registrados para esta carrera
        let existingResult = await RaceResult.findOne({ race: raceId });
        if (existingResult) {
            return res.status(400).json({ msg: 'Los resultados para esta carrera ya han sido registrados.' });
        }

        // 3. Crear y guardar los resultados
        const newRaceResult = new RaceResult({
            race: raceId,
            officialWinner: officialWinner.trim(),
            officialSecond: officialSecond.trim(),
            officialThird: officialThird.trim()
        });

        await newRaceResult.save();

        // 4. Marcar la carrera como completada (opcional, podrías hacerlo al calcular puntos)
        // race.isRaceCompleted = true;
        // await race.save();

        res.status(201).json({ msg: 'Resultados de carrera registrados exitosamente.', newRaceResult });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// --- Endpoint para CALCULAR PUNTOS de una carrera específica (SOLO ADMIN) ---
// @route   POST /api/race-results/:raceId/calculate-scores
// @desc    Calcular y asignar puntos a las predicciones de una carrera
// @access  Private (requiere autenticación, luego añadirás un rol de admin)
router.post('/:raceId/calculate-scores', auth, async (req, res) => {
    try {
        const raceId = req.params.raceId;

        // 1. Obtener los resultados oficiales para esta carrera
        const raceResult = await RaceResult.findOne({ race: raceId });
        if (!raceResult) {
            return res.status(404).json({ msg: 'Resultados oficiales no encontrados para esta carrera. Registre los resultados primero.' });
        }

        const officialTop3 = [
            raceResult.officialWinner.toLowerCase(),
            raceResult.officialSecond.toLowerCase(),
            raceResult.officialThird.toLowerCase()
        ];

        // 2. Obtener la carrera para actualizar su estado
        const race = await Race.findById(raceId);
        if (!race) {
            return res.status(404).json({ msg: 'Carrera no encontrada.' });
        }
        if (race.isRaceCompleted) {
            return res.status(400).json({ msg: 'Los puntos para esta carrera ya fueron calculados.' });
        }


        // 3. Obtener todas las predicciones para esta carrera
        const predictions = await Prediction.find({ race: raceId }).populate('user'); // Popula el usuario para actualizar su score

        // 4. Iterar sobre cada predicción y calcular puntos
        for (let prediction of predictions) {
            let currentPredictionScore = 0;

            const predictedTop3 = [
                prediction.predictedWinner.toLowerCase(),
                prediction.predictedSecond.toLowerCase(),
                prediction.predictedThird.toLowerCase()
            ];

            // Puntuación por posición exacta
            if (predictedTop3[0] === officialTop3[0]) {
                currentPredictionScore += 3;
            }
            if (predictedTop3[1] === officialTop3[1]) {
                currentPredictionScore += 3;
            }
            if (predictedTop3[2] === officialTop3[2]) {
                currentPredictionScore += 3;
            }

            // Puntuación por piloto en Top 3 (si no fue acierto exacto)
            // Primero, aseguramos que el piloto no haya sido ya puntuado por posición exacta
            // Segundo, verificamos si está en el Top 3 oficial.
            // Para el ganador
            if (predictedTop3[0] !== officialTop3[0] && officialTop3.includes(predictedTop3[0])) {
                currentPredictionScore += 1;
            }
            // Para el segundo
            if (predictedTop3[1] !== officialTop3[1] && officialTop3.includes(predictedTop3[1])) {
                currentPredictionScore += 1;
            }
            // Para el tercero
            if (predictedTop3[2] !== officialTop3[2] && officialTop3.includes(predictedTop3[2])) {
                currentPredictionScore += 1;
            }

            // Actualizar el score de la predicción
            prediction.score = currentPredictionScore;
            await prediction.save();

            // Actualizar el totalScore del usuario
            // Aseguramos que no se sumen puntos más de una vez por la misma carrera
            // Si el score del usuario ya incluye puntos de esta predicción, NO sumarlos de nuevo.
            // Una forma simple es que este endpoint solo se pueda ejecutar UNA vez por carrera.
            // Si quieres que sea re-ejecutable, necesitarías restar el `prediction.score` anterior
            // y luego sumar el nuevo, o solo sumar si `prediction.score` era 0.
            if (prediction.user) { // Asegurarse de que el usuario fue populado
                // Solo sumamos el puntaje si no se ha sumado antes.
                // Como race.isRaceCompleted asegura que no se ejecuta dos veces,
                // podemos asumir que es seguro sumar.
                prediction.user.totalScore += currentPredictionScore;
                await prediction.user.save();
            }
        }

        // 5. Marcar la carrera como completada y cerrar las predicciones
        race.isPredictionOpen = false;
        race.isRaceCompleted = true;
        await race.save();

        res.json({ msg: 'Puntos calculados y asignados exitosamente para la carrera: ' + race.name });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;