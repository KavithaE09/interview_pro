const express = require('express');
const router = express.Router();
const {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  markModuleCompleted,
  getCandidateDashboardData
} = require('../controllers/moduleController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public or Candidate Routes
router.get('/public', getModules);
router.get('/dashboard', authenticateToken, getCandidateDashboardData);
router.get('/:id', authenticateToken, getModuleById);
router.post('/:id/complete', authenticateToken, markModuleCompleted);

// Admin Routes
router.get('/', authenticateToken, requireAdmin, getModules);
router.post('/', authenticateToken, requireAdmin, createModule);
router.put('/:id', authenticateToken, requireAdmin, updateModule);
router.delete('/:id', authenticateToken, requireAdmin, deleteModule);

module.exports = router;
