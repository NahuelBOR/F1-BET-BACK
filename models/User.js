const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true, // Elimina espacios en blanco al principio/final
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true, // Guarda el email en minúsculas
        // Puedes añadir una validación regex para el formato del email aquí si lo deseas
    },
    password: { // Aquí guardaremos la contraseña hasheada
        type: String,
        required: true,
        minlength: 6
    },
    totalScore: { // Puntaje acumulado del usuario en todas las carreras
        type: Number,
        default: 0
    },
    isAdmin: { // ¡Nuevo campo!
        type: Boolean,
        default: false // Por defecto, los usuarios no son administradores
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;