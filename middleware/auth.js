const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; // Asegúrate de que esto se cargue desde .env

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No token, autorización denegada' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};

module.exports = auth; // Exporta solo la función de middleware