const express = require('express');
const router = express.Router();
const { runCode, submitProblemCode, getCapabilities } = require('../controllers/executionController');
const { authenticateToken } = require('../middleware/auth');
const { validateAttemptActive } = require('../middleware/validateDeadline');

router.use(authenticateToken);

// System compiler / runtime capabilities
router.get('/capabilities', getCapabilities);

// Run code test in isolated sandbox (custom input or sample test cases)
router.post('/run', runCode);

// Submit code during assessment attempt (evaluates against full test suite)
router.post('/submit-code', validateAttemptActive, submitProblemCode);

module.exports = router;
