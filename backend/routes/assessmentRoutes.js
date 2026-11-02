const express = require('express');
const router = express.Router();
const {
  getPublicAssessments,
  getPublicAssessmentById,
  startDirectAssessment,
  getCandidateAssessments,
  startAssessment,
  getAssessmentQuestions,
  getRemainingTime,
  saveTextAnswer,
  submitAssessment,
  getAttemptResult,
  getCandidateHistory,
  terminateAttempt
} = require('../controllers/assessmentController');
const { authenticateToken } = require('../middleware/auth');
const { validateAttemptActive } = require('../middleware/validateDeadline');

const optionalAuth = (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'interviewpro_jwt_secret');
      req.user = decoded;
    } catch (e) {
      // Ignore token parse error for direct candidates
    }
  }
  next();
};

// -------------------------------------------------------------
// Direct Candidate Assessment Routes (NO PASSWORD LOGIN NEEDED!)
// -------------------------------------------------------------
router.get('/public', getPublicAssessments);
router.get('/direct/:assessmentId', getPublicAssessmentById);
router.post('/:assessmentId/start-direct', startDirectAssessment);

// Questions & real-time timer for active candidate attempt
router.get('/attempts/:attemptId/questions', optionalAuth, getAssessmentQuestions);
router.get('/attempts/:attemptId/timer', optionalAuth, getRemainingTime);

// Save open-ended text answers in real-time
router.put('/attempts/:attemptId/save-answer', optionalAuth, validateAttemptActive, saveTextAnswer);
router.put('/attempts/:attemptId/save-mcq', optionalAuth, validateAttemptActive, saveTextAnswer);

// Final submission
router.post('/attempts/:attemptId/submit', optionalAuth, submitAssessment);

// Proctoring violation — terminate the attempt
router.post('/attempts/:attemptId/terminate', optionalAuth, terminateAttempt);

// Attempt Results
router.get('/attempts/:attemptId/result', optionalAuth, getAttemptResult);

// -------------------------------------------------------------
// Authenticated Candidate / Admin History Routes
// -------------------------------------------------------------
router.get('/my-assessments', authenticateToken, getCandidateAssessments);
router.get('/history', authenticateToken, getCandidateHistory);
router.post('/start', authenticateToken, startAssessment);

module.exports = router;
