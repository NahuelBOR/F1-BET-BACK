const mongoose = require('mongoose');

const raceSchema = new mongoose.Schema({
    name: { // Ej: "Gran Premio de Bahréin"
        type: String,
        required: true,
        unique: true
    },
    location: { // Ej: "Circuito Internacional de Baréin"
        type: String,
        required: true
    },
    date: { // Fecha y hora de la carrera (idealmente en UTC)
        type: Date,
        required: true
    },
    isPredictionOpen: { // Para saber si los usuarios aún pueden hacer predicciones
        type: Boolean,
        default: true
    },
    isRaceCompleted: { // Para saber si la carrera ya terminó y los puntos pueden ser calculados
        type: Boolean,
        default: false
    },
    season: { // Ej: 2025
        type: Number,
        required: true
    },
    round: { // Ej: 1 (primera carrera de la temporada)
        type: Number,
        required: true
    },
    // Podrías añadir más campos como URL de la Wikipedia de la carrera, imagen, etc.
});

const Race = mongoose.model('Race', raceSchema);

module.exports = Race;