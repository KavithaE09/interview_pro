const express = require('express');
const router = express.Router();
const {
  getPublicAssessments,
  getPublicAssessmentById,
  startDirectAssessment,
  getAssessmentQuestions,
  getRemainingTime,
  saveTextAnswer,
  submitAssessment,
  getAttemptResult,
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
    
    }
  }
  next();
};


router.get('/public', getPublicAssessments);
router.get('/direct/:assessmentId', getPublicAssessmentById);
router.post('/:assessmentId/start-direct', startDirectAssessment);

router.get('/attempts/:attemptId/questions', optionalAuth, getAssessmentQuestions);
router.get('/attempts/:attemptId/timer', optionalAuth, getRemainingTime);

router.put('/attempts/:attemptId/save-answer', optionalAuth, validateAttemptActive, saveTextAnswer);

router.post('/attempts/:attemptId/submit', optionalAuth, submitAssessment);

router.post('/attempts/:attemptId/terminate', optionalAuth, terminateAttempt);

router.get('/attempts/:attemptId/result', optionalAuth, getAttemptResult);

module.exports = router;
