const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Para hashear contraseñas
const jwt = require('jsonwebtoken'); // Para crear y verificar JWTs
const User = require('../models/User'); // Importa el modelo de Usuario
const auth = require('../middleware/auth');


// Variable de entorno para la clave secreta de JWT (añádela a tu .env)
// backend/.env
// JWT_SECRET=una_cadena_secreta_muy_larga_y_aleatoria_para_jwt
const JWT_SECRET = process.env.JWT_SECRET;

// @route   POST /api/auth/register
// @desc    Registrar un nuevo usuario
// @access  Public
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ msg: 'El usuario o email ya existe' });
        }

        user = new User({
            username,
            email,
            password
        });

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Generar JWT
        const payload = {
            user: {
                id: user.id, // Mongoose crea automáticamente un ID (_id) para cada documento
                username: user.username
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '7d' }, // El token expira en 7 dias
            (err, token) => {
                if (err) throw err;
                res.json({ token }); // Envía el token al cliente
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/auth/login
// @desc    Autenticar usuario y obtener token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // Generar JWT
        const payload = {
            user: {
                id: user.id,
                username: user.username
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/auth/user
// @desc    Obtener usuario autenticado (con el token)
// @access  Private (requiere token)
router.get('/user', auth, async (req, res) => {
    try {
        // req.user.id viene del middleware `auth`
        const user = await User.findById(req.user.id).select('-password'); // No enviar la contraseña
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});


module.exports = router;