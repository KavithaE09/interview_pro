const pool = require('../config/db');

/**
 * Validates that an assessment attempt is active and has not passed its server-recorded deadline.
 * If expired, updates the attempt status to 'auto_submitted' and rejects further answer changes.
 */
const validateAttemptActive = async (req, res, next) => {
  try {
    const attemptId = req.params.attemptId || req.body.attemptId;
    if (!attemptId) {
      return res.status(400).json({ success: false, message: 'Attempt ID is required.' });
    }

    // Query attempt along with assignment and assessment info
    const [rows] = await pool.query(`
      SELECT 
        a.id AS attempt_id,
        a.assignment_id,
        a.started_at,
        a.deadline_at,
        a.submitted_at,
        a.score,
        a.status AS attempt_status,
        ass.candidate_id,
        ass.assessment_id,
        asm.title,
        asm.duration_minutes,
        asm.total_marks,
        asm.passing_marks,
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), a.deadline_at) AS remaining_seconds
      FROM assessment_attempts a
      JOIN assessment_assignments ass ON a.assignment_id = ass.id
      JOIN assessments asm ON ass.assessment_id = asm.id
      WHERE a.id = ?
    `, [attemptId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assessment attempt not found.' });
    }

    const attempt = rows[0];

    // Ensure logged-in user owns this attempt (if user is attached)
    if (req.user && req.user.role !== 'admin' && attempt.candidate_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this assessment attempt.' });
    }

    // Check if already finalized
    if (attempt.attempt_status === 'submitted' || attempt.attempt_status === 'auto_submitted' || attempt.attempt_status === 'expired') {
      return res.status(400).json({
        success: false,
        isExpired: true,
        message: 'This assessment attempt has already been submitted and finalized.',
        attemptStatus: attempt.attempt_status
      });
    }

    // Check server deadline
    const remainingSeconds = Number(attempt.remaining_seconds);
    if (remainingSeconds <= 0) {
      // Server deadline has passed! Auto-finalize attempt
      await pool.query(
        'UPDATE assessment_attempts SET status = "auto_submitted", submitted_at = UTC_TIMESTAMP() WHERE id = ?',
        [attemptId]
      );
      await pool.query(
        'UPDATE assessment_assignments SET status = "completed" WHERE id = ?',
        [attempt.assignment_id]
      );

      return res.status(403).json({
        success: false,
        isExpired: true,
        message: 'Assessment time limit has expired. Your responses have been automatically submitted.',
        attemptStatus: 'auto_submitted'
      });
    }

    req.attempt = attempt;
    req.remainingSeconds = remainingSeconds;
    next();
  } catch (error) {
    console.error('Error in validateAttemptActive:', error);
    return res.status(500).json({ success: false, message: 'Internal server error validating assessment time.' });
  }
};

module.exports = {
  validateAttemptActive
};
