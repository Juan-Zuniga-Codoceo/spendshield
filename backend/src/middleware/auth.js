// src/middleware/auth.js
/*
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};*/


const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  console.log('Procesando autenticación...');
  
  // Get token from header
  const token = req.header('x-auth-token');
  console.log('Token recibido:', token ? 'Token presente' : 'Token ausente');

  // Check if no token
  if (!token) {
    console.log('Autenticación fallida: Token no proporcionado');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    console.log('Verificando token con JWT_SECRET...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verificado exitosamente para usuario:', decoded.user.id);
    
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Error en verificación de token:', {
      error: err.message,
      stack: err.stack
    });
    res.status(401).json({ msg: 'Token is not valid' });
  }
};