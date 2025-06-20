const User = require('../models/User'); // Necesitamos el modelo de usuario

const adminAuth = async (req, res, next) => {
    // req.user.id viene del middleware `auth`
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'No autorizado: ID de usuario no disponible' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ msg: 'Acceso denegado: No tienes permisos de administrador' });
        }
        next(); // Si es administrador, pasa al siguiente middleware/función de ruta
    } catch (err) {
        console.error('Error en middleware adminAuth:', err.message);
        res.status(500).send('Error del servidor en verificación de administrador');
    }
};

module.exports = adminAuth;