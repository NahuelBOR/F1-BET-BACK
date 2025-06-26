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
    isAdmin: { 
        type: Boolean,
        default: false // Por defecto, los usuarios no son administradores
    },
    profilePicture: {
        type: String,
        default: 'https://res.cloudinary.com/dh3krohqz/image/upload/v1750893404/FPgenerica_avvayb.jpg'
    },
    preferredTeamTheme: { 
        type: String,
        default: 'default' // ID del equipo por defecto (nuestro rojo F1)
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;