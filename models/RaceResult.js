const mongoose = require('mongoose');

const raceResultSchema = new mongoose.Schema({
    race: { // Referencia a la carrera para la que se registran los resultados
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Race',
        required: true,
        unique: true // Solo un conjunto de resultados por carrera
    },
    // Resultados oficiales de los 3 primeros lugares
    // Mantenemos el mismo formato que en las predicciones para facilitar la comparación
    officialWinner: {
        type: String, // Ej: "Max Verstappen"
        required: true,
        trim: true
    },
    officialSecond: {
        type: String, // Ej: "Lando Norris"
        required: true,
        trim: true
    },
    officialThird: {
        type: String, // Ej: "Charles Leclerc"
        required: true,
        trim: true
    },
    // Puedes añadir más campos como los 10 primeros, vuelta rápida, etc., si el proyecto crece.
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const RaceResult = mongoose.model('RaceResult', raceResultSchema);

module.exports = RaceResult;