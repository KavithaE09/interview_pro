const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllAssessments,
  getAssessmentDetailsWithQuestions,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  togglePublishAssessment,
  addMcqQuestion,
  updateMcqQuestion,
  deleteQuestion,
  getAllCandidates,
  getCandidateDetailWithHistory,
  assignAssessmentToCandidates,
  getAllResults
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Dashboard statistics
router.get('/dashboard-stats', getDashboardStats);

// Category CRUD
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Assessment CRUD & publish toggle
router.get('/assessments', getAllAssessments);
router.post('/assessments', createAssessment);
router.get('/assessments/:id', getAssessmentDetailsWithQuestions);
router.put('/assessments/:id', updateAssessment);
router.delete('/assessments/:id', deleteAssessment);
router.patch('/assessments/:id/toggle-publish', togglePublishAssessment);

// MCQ Questions
router.post('/questions/mcq', addMcqQuestion);
router.put('/questions/mcq/:id', updateMcqQuestion);
router.delete('/questions/:id', deleteQuestion);

// Candidate management
router.get('/candidates', getAllCandidates);
router.get('/candidates/:candidateId', getCandidateDetailWithHistory);
router.post('/assign', assignAssessmentToCandidates);

// Results & Analytics
router.get('/results', getAllResults);

module.exports = router;
