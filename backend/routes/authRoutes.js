const express = require('express');
const router = express.Router();
const { register, registerAdmin, login, candidateLogin, getProfile, updateProfile, getPublicCategories } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.get('/categories', getPublicCategories);
router.post('/register', register);
router.post('/register-admin', registerAdmin);
router.post('/login', login);
router.post('/candidate-login', candidateLogin);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
