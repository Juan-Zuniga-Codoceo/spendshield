// src/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const User = require('../models/User');

// Configuración de Multer
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    try {
      await fs.access(uploadDir).catch(() => fs.mkdir(uploadDir, { recursive: true }));
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif)'));
  }
});

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'El usuario ya existe' });
    }

    user = new User({
      name,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
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

// @route   GET api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, email } = req.body;

  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      msg: 'Perfil actualizado correctamente',
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   POST api/users/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No se ha subido ningún archivo' });
    }

    const user = await User.findById(req.user.id);
    
    // Eliminar avatar anterior si existe
    if (user.avatarPath) {
      const oldAvatarPath = path.join(__dirname, '../../', user.avatarPath);
      try {
        await fs.access(oldAvatarPath);
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        console.log('No se encontró avatar previo para eliminar');
      }
    }

    // Actualizar rutas del avatar con la URL completa
    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
const avatarPath = `uploads/avatars/${req.file.filename}`;

user.avatar = avatarUrl;
user.avatarPath = avatarPath;
    await user.save();

    res.json({
      msg: 'Avatar actualizado correctamente',
      avatar: user.avatar
    });
  } catch (err) {
    console.error('Error en la subida del avatar:', err);
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo temporal:', unlinkError);
      }
    }
    res.status(500).json({ 
      msg: 'Error al subir el avatar',
      error: err.message 
    });
  }
});

const debugMiddleware = (req, res, next) => {
  console.log('Debug Middleware:');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
};
// @route   PUT api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', auth, async (req, res) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Raw body:', req.rawBody);
  try {
    // Agregar console.log para debug
    console.log('Request body:', req.body);

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        msg: 'Por favor proporciona la contraseña actual y la nueva' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Contraseña actual incorrecta' });
    }

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ msg: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en cambio de contraseña:', err);
    res.status(500).json({ 
      msg: 'Error del servidor', 
      error: err.message 
    });
  }
});

module.exports = router;