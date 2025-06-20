const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    user: { // Referencia al usuario que hizo la predicción
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Hace referencia al modelo 'User'
        required: true
    },
    race: { // Referencia a la carrera para la que se hizo la predicción
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Race', // Hace referencia al modelo 'Race'
        required: true
    },
    // Predicciones de los 3 primeros lugares por nombre del piloto
    // Esto es más flexible que usar IDs si no tenemos un modelo de Pilotos separado
    predictedWinner: {
        type: String, // Ej: "Max Verstappen"
        required: true,
        trim: true
    },
    predictedSecond: {
        type: String, // Ej: "Franco Colapinto"
        required: true,
        trim: true
    },
    predictedThird: {
        type: String, // Ej: "Lewis Hamilton"
        required: true,
        trim: true
    },
    score: { // Puntaje obtenido por esta predicción en particular
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Aseguramos que un usuario solo pueda tener una predicción por carrera
predictionSchema.index({ user: 1, race: 1 }, { unique: true });

const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = Prediction;