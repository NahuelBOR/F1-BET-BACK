// backend/server.js
require('dotenv').config(); // Carga las variables de entorno desde .env

const express = require('express');
const mongoose = require('mongoose'); // Importa Mongoose
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// Importar rutas
const authRoutes = require('./routes/auth');
const raceRoutes = require('./routes/races');
const predictionRoutes = require('./routes/predictions');
const userRoutes = require('./routes/users'); // Para obtener rankings y perfiles
const raceResultRoutes = require('./routes/raceResults');

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Conectado a MongoDB Atlas / Base de datos local.');
    })
    .catch((err) => {
        console.error('Error al conectar a MongoDB:', err.message);
        // Opcional: Detener la aplicación si la conexión a la DB falla
        // process.exit(1);
    });

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/auth', authRoutes); // Prefijo /api/auth para todas las rutas de autenticación
app.use('/api/races', raceRoutes); // Prefijo /api/races para rutas de carreras
app.use('/api/predictions', predictionRoutes); // Prefijo /api/predictions para rutas de predicciones
app.use('/api/users', userRoutes); // Prefijo /api/users para rutas de usuarios (ranking, perfil)
app.use('/api/race-results', raceResultRoutes); //Prefijo /api/race-results ruta para resultados/cálculo de puntos


// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de Predicciones de F1 funcionando con MongoDB!');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});