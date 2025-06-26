// backend/routes/upload.js
const express = require('express');
const multer = require('multer'); // Para manejar la subida de archivos
const cloudinary = require('cloudinary').v2; // SDK de Cloudinary
const auth = require('../middleware/auth'); // Middleware de autenticación
const User = require('../models/User'); // Importa el modelo de usuario para actualizar la foto

const router = express.Router();

// Configuración de Cloudinary
// Cloudinary tomará las credenciales de las variables de entorno (process.env)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de Multer para almacenar el archivo en memoria (como un buffer)
// Cloudinary subirá el archivo directamente desde este buffer, sin guardarlo en disco local.
const storage = multer.memoryStorage();

// Filtro de archivos para permitir solo imágenes
const fileFilter = (req, file, cb) => {
    // Verifica si el tipo MIME del archivo comienza con 'image/'
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Aceptar el archivo
    } else {
        // Rechazar el archivo con un error
        cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF)!'), false);
    }
};

// Inicializar la subida con Multer
// 'profilePicture' es el nombre del campo en el formulario que contendrá el archivo
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de tamaño del archivo: 5MB (puedes ajustarlo)
});

// @route   POST /api/upload/profile-picture
// @desc    Sube una imagen de perfil a Cloudinary para el usuario autenticado
// @access  Privado (requiere autenticación JWT)
router.post('/profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        // Verificar si se ha subido un archivo
        if (!req.file) {
            return res.status(400).json({ msg: 'No se ha seleccionado ningún archivo de imagen.' });
        }

        // Subir la imagen a Cloudinary
        // req.file.buffer contiene los datos binarios del archivo
        // req.file.mimetype es el tipo MIME del archivo (ej. 'image/jpeg')
        const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            {
                folder: 'f1-predictor/profile-pictures', // Carpeta donde se guardará en tu cuenta de Cloudinary
                use_filename: true, // Usa el nombre original del archivo (opcional)
                unique_filename: false, // Permite sobreescribir si el public_id es el mismo
                overwrite: true, // Si ya existe una imagen con el mismo public_id, la sobrescribe
                public_id: `user-${req.user.id}` // Nombre público único basado en el ID del usuario
                                                  // Esto asegura que cada usuario tenga una única foto de perfil
                                                  // y que al subir una nueva, reemplace la anterior.
            }
        );

        // Obtener el usuario de la base de datos usando el ID del token
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }

        // Guardar la URL segura de Cloudinary en el campo profilePicture del usuario
        user.profilePicture = result.secure_url;
        await user.save(); // Guarda los cambios en la base de datos

        // Responder con un mensaje de éxito y la URL de la nueva foto de perfil
        res.json({
            msg: 'Imagen de perfil subida exitosamente a Cloudinary.',
            profilePicture: user.profilePicture
        });

    } catch (err) {
        console.error('Error al subir a Cloudinary o procesar imagen:', err);
        // Manejo de errores específicos de Multer (ej. tamaño de archivo excedido)
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ msg: `El archivo es demasiado grande. Máximo ${upload.limits.fileSize / (1024 * 1024)}MB.` });
            }
        }
        // Otros errores (ej. error en el filtro de archivo o en Cloudinary)
        res.status(500).json({ msg: err.message || 'Error del servidor al subir la imagen.' });
    }
});

module.exports = router;
