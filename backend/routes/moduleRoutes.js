const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  markModuleCompleted,
  getCandidateDashboardData,
  uploadModuleResource
} = require('../controllers/moduleController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// File Upload Route (Admin only)
router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), uploadModuleResource);

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
