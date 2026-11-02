const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Public: Get all published assessments for direct candidate browsing
const getPublicAssessments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        asm.id,
        asm.title,
        asm.description,
        asm.duration_minutes,
        asm.total_marks,
        asm.passing_marks,
        asm.status,
        c.category_name,
        (SELECT COUNT(*) FROM questions q WHERE q.assessment_id = asm.id) AS question_count
      FROM assessments asm
      LEFT JOIN categories c ON asm.category_id = c.id
      WHERE asm.status = 'published'
      ORDER BY asm.id DESC
    `);
    return res.status(200).json({ success: true, assessments: rows });
  } catch (err) {
    console.error('Error fetching public assessments:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving assessments.' });
  }
};

// Public: Get details of a single assessment for candidate landing screen
const getPublicAssessmentById = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        asm.id,
        asm.title,
        asm.description,
        asm.duration_minutes,
        asm.total_marks,
        asm.passing_marks,
        asm.status,
        c.category_name,
        (SELECT COUNT(*) FROM questions q WHERE q.assessment_id = asm.id) AS question_count
      FROM assessments asm
      LEFT JOIN categories c ON asm.category_id = c.id
      WHERE asm.id = ? AND asm.status = 'published'
    `, [assessmentId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assessment not found or not published.' });
    }

    return res.status(200).json({ success: true, assessment: rows[0] });
  } catch (err) {
    console.error('Error fetching assessment by id:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving assessment.' });
  }
};

// Public / Direct Candidate Entry: Start assessment with Name, Email, Phone (NO PASSWORD NEEDED!)
const startDirectAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { name, email, phone } = req.body;

    if (!name || !name.trim() || !email || !email.trim() || !phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Candidate Name, Email, and Phone number are required.' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const nameTrimmed = name.trim();
    const phoneTrimmed = phone.trim();

    const [assessments] = await pool.query(`
      SELECT asm.id, asm.title, asm.duration_minutes, asm.total_marks, asm.passing_marks, c.category_name
      FROM assessments asm
      LEFT JOIN categories c ON asm.category_id = c.id
      WHERE asm.id = ? AND asm.status = 'published'
    `, [assessmentId]);

    if (assessments.length === 0) {
      return res.status(404).json({ success: false, message: 'Assessment not found or not available.' });
    }

    const assessment = assessments[0];

    // Find or create candidate without requiring password
    let candidateId;
    const [existingUsers] = await pool.query('SELECT id, name, email, role FROM users WHERE email = ?', [emailTrimmed]);

    if (existingUsers.length > 0) {
      candidateId = existingUsers[0].id;
      await pool.query('UPDATE users SET name = ?, phone = COALESCE(NULLIF(?, ""), phone) WHERE id = ?', [nameTrimmed, phoneTrimmed, candidateId]);
    } else {
      const [insertUser] = await pool.query(
        'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, "DIRECT_CANDIDATE", "candidate")',
        [nameTrimmed, emailTrimmed, phoneTrimmed]
      );
      candidateId = insertUser.insertId;
    }

    // Ensure assessment assignment
    let assignmentId;
    const [assignments] = await pool.query(
      'SELECT id, status FROM assessment_assignments WHERE assessment_id = ? AND candidate_id = ?',
      [assessmentId, candidateId]
    );

    if (assignments.length > 0) {
      assignmentId = assignments[0].id;
    } else {
      const [newAss] = await pool.query(
        'INSERT INTO assessment_assignments (assessment_id, candidate_id, status) VALUES (?, ?, "assigned")',
        [assessmentId, candidateId]
      );
      assignmentId = newAss.insertId;
    }

    // Check if an attempt already exists
    const [existingAttempts] = await pool.query(`
      SELECT 
        id, started_at, deadline_at, submitted_at, score, status,
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), deadline_at) AS remaining_seconds
      FROM assessment_attempts
      WHERE assignment_id = ?
      ORDER BY id DESC LIMIT 1
    `, [assignmentId]);

    const token = jwt.sign(
      { id: candidateId, email: emailTrimmed, name: nameTrimmed, role: 'candidate' },
      process.env.JWT_SECRET || 'interviewpro_jwt_secret',
      { expiresIn: '7d' }
    );

    if (existingAttempts.length > 0) {
      const attempt = existingAttempts[0];

      if (attempt.status === 'submitted' || attempt.status === 'auto_submitted' || attempt.status === 'expired') {
        return res.status(200).json({
          success: true,
          isCompleted: true,
          message: 'You have already completed this interview assessment.',
          attemptId: attempt.id,
          token,
          score: attempt.score
        });
      }

      const remainingSeconds = Number(attempt.remaining_seconds);
      if (remainingSeconds <= 0) {
        await autoSubmitAttempt(attempt.id);
        return res.status(200).json({
          success: true,
          isExpired: true,
          message: 'The deadline for this assessment has expired.',
          attemptId: attempt.id,
          token
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Resuming active assessment attempt.',
        attemptId: attempt.id,
        assignmentId,
        title: assessment.title,
        categoryName: assessment.category_name,
        remainingSeconds,
        durationMinutes: assessment.duration_minutes,
        token,
        candidate: { id: candidateId, name: nameTrimmed, email: emailTrimmed }
      });
    }

    const durationMinutes = Number(assessment.duration_minutes) || 25;
    const [createResult] = await pool.query(`
      INSERT INTO assessment_attempts (assignment_id, started_at, deadline_at, status)
      VALUES (?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), 'in_progress')
    `, [assignmentId, durationMinutes]);

    const newAttemptId = createResult.insertId;
    await pool.query('UPDATE assessment_assignments SET status = "in_progress" WHERE id = ?', [assignmentId]);

    const [attemptData] = await pool.query(`
      SELECT 
        id, started_at, deadline_at,
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), deadline_at) AS remaining_seconds
      FROM assessment_attempts WHERE id = ?
    `, [newAttemptId]);

    return res.status(201).json({
      success: true,
      message: 'Assessment started successfully.',
      attemptId: newAttemptId,
      assignmentId,
      title: assessment.title,
      categoryName: assessment.category_name,
      startedAt: attemptData[0].started_at,
      deadlineAt: attemptData[0].deadline_at,
      remainingSeconds: Number(attemptData[0].remaining_seconds),
      durationMinutes,
      token,
      candidate: { id: candidateId, name: nameTrimmed, email: emailTrimmed }
    });
  } catch (err) {
    console.error('Error starting direct assessment:', err);
    return res.status(500).json({ success: false, message: 'Server error starting assessment.' });
  }
};

// 1. Get all assessments assigned to candidate
const getCandidateAssessments = async (req, res) => {
  try {
    const candidateId = req.user ? req.user.id : null;

    const [rows] = await pool.query(`
      SELECT 
        ass.id AS assignment_id,
        ass.status AS assignment_status,
        ass.assigned_at,
        asm.id AS assessment_id,
        asm.title,
        asm.description,
        c.category_name,
        asm.duration_minutes,
        asm.total_marks,
        asm.passing_marks,
        asm.available_from,
        asm.available_until,
        asm.status AS assessment_status,
        asm.allow_view_answers,
        (SELECT COUNT(*) FROM questions q WHERE q.assessment_id = asm.id) AS question_count,
        att.id AS attempt_id,
        att.started_at,
        att.deadline_at,
        att.submitted_at,
        att.score,
        att.status AS attempt_status,
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), att.deadline_at) AS remaining_seconds
      FROM assessment_assignments ass
      JOIN assessments asm ON ass.assessment_id = asm.id
      LEFT JOIN categories c ON asm.category_id = c.id
      LEFT JOIN assessment_attempts att ON att.assignment_id = ass.id
      WHERE ass.candidate_id = ? AND asm.status = 'published'
      ORDER BY ass.assigned_at DESC
    `, [candidateId || 0]);

    const [allPublished] = await pool.query(`
      SELECT 
        NULL AS assignment_id,
        'unassigned' AS assignment_status,
        NULL AS assigned_at,
        asm.id AS assessment_id,
        asm.title,
        asm.description,
        c.category_name,
        asm.duration_minutes,
        asm.total_marks,
        asm.passing_marks,
        asm.available_from,
        asm.available_until,
        asm.status AS assessment_status,
        asm.allow_view_answers,
        (SELECT COUNT(*) FROM questions q WHERE q.assessment_id = asm.id) AS question_count,
        NULL AS attempt_id,
        NULL AS started_at,
        NULL AS deadline_at,
        NULL AS submitted_at,
        NULL AS score,
        NULL AS attempt_status,
        NULL AS remaining_seconds
      FROM assessments asm
      LEFT JOIN categories c ON asm.category_id = c.id
      WHERE asm.status = 'published'
        AND asm.id NOT IN (
          SELECT assessment_id FROM assessment_assignments WHERE candidate_id = ?
        )
      ORDER BY asm.id DESC
    `, [candidateId || 0]);

    const combined = [...rows, ...allPublished];
    return res.status(200).json({ success: true, assessments: combined });
  } catch (error) {
    console.error('Error fetching candidate assessments:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving assessments.' });
  }
};

// 2. Start Assessment or Resume Existing Active Attempt
const startAssessment = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { assessmentId } = req.body;

    if (!assessmentId) {
      return res.status(400).json({ success: false, message: 'Assessment ID is required.' });
    }

    const [assignments] = await pool.query(`
      SELECT ass.id, ass.status, asm.duration_minutes, asm.title, c.category_name
      FROM assessment_assignments ass
      JOIN assessments asm ON ass.assessment_id = asm.id
      LEFT JOIN categories c ON asm.category_id = c.id
      WHERE ass.assessment_id = ? AND ass.candidate_id = ?
    `, [assessmentId, candidateId]);

    let assignment;
    if (assignments.length === 0) {
      const [assessments] = await pool.query(
        'SELECT asm.id, asm.duration_minutes, asm.title, c.category_name FROM assessments asm LEFT JOIN categories c ON asm.category_id = c.id WHERE asm.id = ? AND asm.status = "published"',
        [assessmentId]
      );
      if (assessments.length === 0) {
        return res.status(403).json({ success: false, message: 'This assessment is not available.' });
      }
      const [newAss] = await pool.query(
        'INSERT INTO assessment_assignments (assessment_id, candidate_id, status) VALUES (?, ?, "assigned")',
        [assessmentId, candidateId]
      );
      assignment = {
        id: newAss.insertId,
        status: 'assigned',
        duration_minutes: assessments[0].duration_minutes,
        title: assessments[0].title,
        category_name: assessments[0].category_name
      };
    } else {
      assignment = assignments[0];
    }

    const [existingAttempts] = await pool.query(`
      SELECT 
        id, started_at, deadline_at, submitted_at, score, status,
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), deadline_at) AS remaining_seconds
      FROM assessment_attempts
      WHERE assignment_id = ?
      ORDER BY id DESC LIMIT 1
    `, [assignment.id]);

    if (existingAttempts.length > 0) {
      const attempt = existingAttempts[0];

      if (attempt.status === 'submitted' || attempt.status === 'auto_submitted' || attempt.status === 'expired') {
        return res.status(400).json({
          success: false,
          isCompleted: true,
          message: 'You have already completed this interview assessment.',
          attemptId: attempt.id,
          attemptStatus: attempt.status,
          score: attempt.score
        });
      }

      const remainingSeconds = Number(attempt.remaining_seconds);
      if (remainingSeconds <= 0) {
        await autoSubmitAttempt(attempt.id);
        return res.status(400).json({
          success: false,
          isExpired: true,
          message: 'The deadline for this assessment has expired.',
          attemptId: attempt.id,
          attemptStatus: 'auto_submitted'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Resuming active assessment attempt.',
        attemptId: attempt.id,
        assignmentId: assignment.id,
        title: assignment.title,
        categoryName: assignment.category_name,
        startedAt: attempt.started_at,
        deadlineAt: attempt.deadline_at,
        remainingSeconds,
        durationMinutes: assignment.duration_minutes
      });
    }

    const durationMinutes = Number(assignment.duration_minutes) || 25;

    const [createResult] = await pool.query(`
      INSERT INTO assessment_attempts (assignment_id, started_at, deadline_at, status)
      VALUES (?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), 'in_progress')
    `, [assignment.id, durationMinutes]);

    const newAttemptId = createResult.insertId;
    await pool.query('UPDATE assessment_assignments SET status = "in_progress" WHERE id = ?', [assignment.id]);

    const [attemptData] = await pool.query(`
      SELECT 
        id, started_at, deadline_at,
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), deadline_at) AS remaining_seconds
      FROM assessment_attempts WHERE id = ?
    `, [newAttemptId]);

    return res.status(201).json({
      success: true,
      message: 'Assessment started successfully.',
      attemptId: newAttemptId,
      assignmentId: assignment.id,
      title: assignment.title,
      categoryName: assignment.category_name,
      startedAt: attemptData[0].started_at,
      deadlineAt: attemptData[0].deadline_at,
      remainingSeconds: Number(attemptData[0].remaining_seconds),
      durationMinutes
    });
  } catch (error) {
    console.error('Error starting assessment:', error);
    return res.status(500).json({ success: false, message: 'Server error starting assessment.' });
  }
};

// 3. Get Questions for an Active Assessment Attempt (Space for candidate answer, no MCQs!)
const getAssessmentQuestions = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const candidateId = req.user ? req.user.id : null;

    const [attempts] = await pool.query(`
      SELECT 
        att.id, att.status, att.started_at, att.deadline_at,
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), att.deadline_at) AS remaining_seconds,
        ass.candidate_id, ass.assessment_id,
        asm.title, asm.description, asm.duration_minutes, asm.total_marks,
        c.category_name
      FROM assessment_attempts att
      JOIN assessment_assignments ass ON att.assignment_id = ass.id
      JOIN assessments asm ON ass.assessment_id = asm.id
      LEFT JOIN categories c ON asm.category_id = c.id
      WHERE att.id = ?
    `, [attemptId]);

    if (attempts.length === 0) {
      return res.status(404).json({ success: false, message: 'Assessment attempt not found.' });
    }

    const attempt = attempts[0];
    if (candidateId && attempt.candidate_id !== candidateId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this assessment attempt.' });
    }

    const remainingSeconds = Number(attempt.remaining_seconds);
    const isExpired = remainingSeconds <= 0 && attempt.status === 'in_progress';

    if (isExpired) {
      await autoSubmitAttempt(attempt.id);
      return res.status(400).json({
        success: false,
        isExpired: true,
        message: 'The time limit for this assessment has expired. Your answers have been submitted.',
        attemptId: attempt.id
      });
    }

    // Fetch open-ended questions (do NOT expose expected keywords before submission)
    const [questions] = await pool.query(`
      SELECT id, question_text, marks, question_order
      FROM questions
      WHERE assessment_id = ?
      ORDER BY question_order ASC, id ASC
    `, [attempt.assessment_id]);

    // Fetch previously saved candidate text answers
    const [savedAnswers] = await pool.query(`
      SELECT question_id, answer_text, marked_for_review
      FROM candidate_answers
      WHERE attempt_id = ?
    `, [attemptId]);

    const answersMap = {};
    savedAnswers.forEach(ans => {
      answersMap[ans.question_id] = {
        answerText: ans.answer_text || '',
        markedForReview: Boolean(ans.marked_for_review)
      };
    });

    return res.status(200).json({
      success: true,
      assessment: {
        id: attempt.assessment_id,
        title: attempt.title,
        description: attempt.description,
        categoryName: attempt.category_name,
        durationMinutes: attempt.duration_minutes,
        totalMarks: attempt.total_marks
      },
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.started_at,
        deadlineAt: attempt.deadline_at,
        remainingSeconds: Math.max(0, remainingSeconds)
      },
      questions,
      savedAnswers: answersMap
    });
  } catch (error) {
    console.error('Error fetching assessment questions:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving assessment questions.' });
  }
};

// 4. Retrieve Remaining Time
const getRemainingTime = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const candidateId = req.user ? req.user.id : null;

    const [rows] = await pool.query(`
      SELECT 
        att.id, att.status, att.deadline_at,
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), att.deadline_at) AS remaining_seconds,
        ass.candidate_id
      FROM assessment_attempts att
      JOIN assessment_assignments ass ON att.assignment_id = ass.id
      WHERE att.id = ?
    `, [attemptId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    if (candidateId && rows[0].candidate_id !== candidateId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const remainingSeconds = Number(rows[0].remaining_seconds);

    if (remainingSeconds <= 0 && rows[0].status === 'in_progress') {
      await autoSubmitAttempt(rows[0].id);
      return res.status(200).json({
        success: true,
        remainingSeconds: 0,
        isExpired: true,
        status: 'auto_submitted',
        message: 'Assessment time expired.'
      });
    }

    return res.status(200).json({
      success: true,
      remainingSeconds: Math.max(0, remainingSeconds),
      deadlineAt: rows[0].deadline_at,
      status: rows[0].status
    });
  } catch (error) {
    console.error('Error getting remaining time:', error);
    return res.status(500).json({ success: false, message: 'Server error checking time.' });
  }
};

// 5. Save/Update Candidate Text Answer during assessment (Auto-save)
const saveTextAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, answerText = '', markedForReview = false } = req.body;
    const candidateId = req.user ? req.user.id : null;

    if (!questionId) {
      return res.status(400).json({ success: false, message: 'Question ID is required.' });
    }

    const [attempts] = await pool.query(`
      SELECT 
        att.id, att.status,
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), att.deadline_at) AS remaining_seconds,
        ass.candidate_id
      FROM assessment_attempts att
      JOIN assessment_assignments ass ON att.assignment_id = ass.id
      WHERE att.id = ?
    `, [attemptId]);

    if (attempts.length === 0) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    const attempt = attempts[0];
    if (candidateId && attempt.candidate_id !== candidateId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Assessment has already been completed or closed. Further answer updates are rejected.'
      });
    }

    if (Number(attempt.remaining_seconds) <= 0) {
      await autoSubmitAttempt(attempt.id);
      return res.status(400).json({
        success: false,
        isExpired: true,
        message: 'Time expired! Assessment is closed.'
      });
    }

    const isMarked = markedForReview ? 1 : 0;

    await pool.query(`
      INSERT INTO candidate_answers (attempt_id, question_id, answer_text, marked_for_review)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        answer_text = VALUES(answer_text),
        marked_for_review = VALUES(marked_for_review),
        answered_at = CURRENT_TIMESTAMP
    `, [attemptId, questionId, answerText, isMarked]);

    return res.status(200).json({
      success: true,
      message: 'Answer saved successfully.',
      questionId,
      answerText,
      markedForReview: Boolean(isMarked)
    });
  } catch (error) {
    console.error('Error saving text answer:', error);
    return res.status(500).json({ success: false, message: 'Server error saving answer.' });
  }
};

// Internal Helper: Evaluate answers based on expected keywords and calculate final score!
async function calculateAndFinalizeAttempt(attemptId, submissionType = 'submitted') {
  const [attempts] = await pool.query(`
    SELECT 
      att.id, att.assignment_id, att.status,
      ass.assessment_id,
      asm.total_marks, asm.passing_marks
    FROM assessment_attempts att
    JOIN assessment_assignments ass ON att.assignment_id = ass.id
    JOIN assessments asm ON ass.assessment_id = asm.id
    WHERE att.id = ?
  `, [attemptId]);

  if (attempts.length === 0) return null;
  const attempt = attempts[0];

  if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
    return attempt;
  }

  // Fetch all questions with expected keywords
  const [questions] = await pool.query(`
    SELECT q.id AS question_id, q.marks, q.expected_keywords, q.explanation
    FROM questions q
    WHERE q.assessment_id = ?
  `, [attempt.assessment_id]);

  const [answers] = await pool.query(`
    SELECT question_id, answer_text
    FROM candidate_answers
    WHERE attempt_id = ?
  `, [attemptId]);

  const answerMap = {};
  answers.forEach(a => {
    answerMap[a.question_id] = a.answer_text || '';
  });

  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const q of questions) {
    const rawAnswer = (answerMap[q.question_id] || '').trim();

    if (!rawAnswer || rawAnswer.length < 5) {
      unansweredCount++;
      await pool.query(
        'INSERT INTO candidate_answers (attempt_id, question_id, answer_text, score_awarded, keywords_matched) VALUES (?, ?, ?, 0, "") ON DUPLICATE KEY UPDATE score_awarded = 0, keywords_matched = ""',
        [attemptId, q.question_id, rawAnswer]
      );
      continue;
    }

    const normAnswer = rawAnswer.toLowerCase();
    const keywordList = (q.expected_keywords || '')
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    // Identify which keywords candidate included
    const matchedKeywords = keywordList.filter(kw => normAnswer.includes(kw));

    // Dynamic keyword-based scoring:
    // If candidate mentions key concepts, score is awarded proportionally
    // Matching 3 or more concepts (or 35%+ of keywords) yields full/high marks
    const targetKeywordsCount = Math.min(3, Math.ceil(keywordList.length * 0.35));
    const matchRatio = Math.min(1, matchedKeywords.length / Math.max(1, targetKeywordsCount));
    const scoreAwarded = Number((matchRatio * Number(q.marks)).toFixed(1));

    if (scoreAwarded >= (Number(q.marks) * 0.5)) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    totalScore += scoreAwarded;

    await pool.query(
      'INSERT INTO candidate_answers (attempt_id, question_id, answer_text, score_awarded, keywords_matched) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE score_awarded = VALUES(score_awarded), keywords_matched = VALUES(keywords_matched)',
      [attemptId, q.question_id, rawAnswer, scoreAwarded, matchedKeywords.join(', ')]
    );
  }

  const finalScore = Number(totalScore.toFixed(2));

  await pool.query(`
    UPDATE assessment_attempts
    SET status = ?, submitted_at = UTC_TIMESTAMP(), score = ?
    WHERE id = ?
  `, [submissionType, finalScore, attemptId]);

  await pool.query(`
    UPDATE assessment_assignments
    SET status = 'completed'
    WHERE id = ?
  `, [attempt.assignment_id]);

  return {
    attemptId,
    score: finalScore,
    totalMarks: attempt.total_marks,
    passingMarks: attempt.passing_marks,
    correctCount,
    incorrectCount,
    unansweredCount,
    totalQuestions: questions.length,
    passed: finalScore >= attempt.passing_marks
  };
}

async function autoSubmitAttempt(attemptId) {
  try {
    return await calculateAndFinalizeAttempt(attemptId, 'auto_submitted');
  } catch (err) {
    console.error('Error auto-submitting attempt:', err);
  }
}

// 6. Final Assessment Submission
const submitAssessment = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const candidateId = req.user ? req.user.id : null;

    const [attempts] = await pool.query(`
      SELECT att.id, att.status, ass.candidate_id
      FROM assessment_attempts att
      JOIN assessment_assignments ass ON att.assignment_id = ass.id
      WHERE att.id = ?
    `, [attemptId]);

    if (attempts.length === 0) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    if (candidateId && attempts[0].candidate_id !== candidateId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (attempts[0].status === 'submitted' || attempts[0].status === 'auto_submitted') {
      return res.status(200).json({
        success: true,
        message: 'Assessment was already submitted.',
        attemptId: Number(attemptId)
      });
    }

    const result = await calculateAndFinalizeAttempt(attemptId, 'submitted');

    return res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully.',
      result
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting assessment.' });
  }
};

// 7. Get Attempt Results Breakdown with candidate answers & keyword analysis
const getAttemptResult = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const candidateId = req.user ? req.user.id : null;

    const [attempts] = await pool.query(`
      SELECT 
        att.id AS attempt_id,
        att.started_at,
        att.deadline_at,
        att.submitted_at,
        att.score,
        att.status AS attempt_status,
        ass.id AS assignment_id,
        ass.candidate_id,
        u.name AS candidate_name,
        u.email AS candidate_email,
        asm.id AS assessment_id,
        asm.title AS assessment_title,
        asm.description AS assessment_description,
        asm.total_marks,
        asm.passing_marks,
        asm.allow_view_answers,
        c.category_name,
        TIMESTAMPDIFF(SECOND, att.started_at, att.submitted_at) AS time_taken_seconds
      FROM assessment_attempts att
      JOIN assessment_assignments ass ON att.assignment_id = ass.id
      JOIN users u ON ass.candidate_id = u.id
      JOIN assessments asm ON ass.assessment_id = asm.id
      LEFT JOIN categories c ON asm.category_id = c.id
      WHERE att.id = ?
    `, [attemptId]);

    if (attempts.length === 0) {
      return res.status(404).json({ success: false, message: 'Assessment attempt not found.' });
    }

    const attempt = attempts[0];

    // For in-progress attempts, only the assigned candidate or admin can view
    if (attempt.attempt_status === 'in_progress') {
      if (candidateId && attempt.candidate_id !== candidateId && req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized.' });
      }
      return res.status(400).json({
        success: false,
        message: 'Assessment is currently in progress. Submit before viewing results.'
      });
    }

    const [questions] = await pool.query(`
      SELECT id, question_text, marks, question_order, expected_keywords, explanation
      FROM questions
      WHERE assessment_id = ?
      ORDER BY question_order ASC, id ASC
    `, [attempt.assessment_id]);

    const [candidateAnswers] = await pool.query(`
      SELECT question_id, answer_text, score_awarded, keywords_matched
      FROM candidate_answers
      WHERE attempt_id = ?
    `, [attemptId]);

    const answerMap = {};
    candidateAnswers.forEach(ans => {
      answerMap[ans.question_id] = ans;
    });

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const questionsReview = questions.map(q => {
      const userAns = answerMap[q.id];
      const answerText = userAns ? (userAns.answer_text || '') : '';
      const scoreAwarded = userAns ? Number(userAns.score_awarded || 0) : 0;
      const matchedKeywords = userAns ? (userAns.keywords_matched || '') : '';
      const isUnanswered = !answerText || answerText.trim().length === 0;
      const isPassedQuestion = scoreAwarded >= (Number(q.marks) * 0.5);

      if (isUnanswered) {
        unansweredCount++;
      } else if (isPassedQuestion) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      return {
        id: q.id,
        questionText: q.question_text,
        marks: q.marks,
        questionOrder: q.question_order,
        candidateAnswer: answerText,
        scoreAwarded,
        matchedKeywords: matchedKeywords ? matchedKeywords.split(', ') : [],
        expectedKeywords: attempt.allow_view_answers && q.expected_keywords ? q.expected_keywords.split(',') : [],
        explanation: attempt.allow_view_answers ? q.explanation : null,
        isUnanswered,
        isPassedQuestion
      };
    });

    const totalQuestions = questions.length;
    const score = Number(attempt.score);
    const totalMarks = Number(attempt.total_marks);
    const passingMarks = Number(attempt.passing_marks);
    const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(1)) : 0;
    const isPassed = score >= passingMarks;

    return res.status(200).json({
      success: true,
      result: {
        attemptId: attempt.attempt_id,
        candidateName: attempt.candidate_name,
        candidateEmail: attempt.candidate_email,
        assessmentTitle: attempt.assessment_title,
        assessmentDescription: attempt.assessment_description,
        categoryName: attempt.category_name,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        timeTakenSeconds: attempt.time_taken_seconds || 0,
        status: attempt.attempt_status,
        score,
        totalMarks,
        passingMarks,
        percentage,
        isPassed,
        totalQuestions,
        answeredCount: totalQuestions - unansweredCount,
        correctCount,
        incorrectCount,
        unansweredCount,
        allowViewAnswers: Boolean(attempt.allow_view_answers),
        questionsReview
      }
    });
  } catch (error) {
    console.error('Error fetching attempt result:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving result breakdown.' });
  }
};

// 8. Candidate Assessment History
const getCandidateHistory = async (req, res) => {
  try {
    const candidateId = req.user.id;

    const [rows] = await pool.query(`
      SELECT 
        att.id AS attempt_id,
        att.started_at,
        att.submitted_at,
        att.score,
        att.status AS attempt_status,
        asm.id AS assessment_id,
        asm.title AS assessment_title,
        asm.total_marks,
        asm.passing_marks,
        c.category_name,
        (SELECT COUNT(*) FROM questions q WHERE q.assessment_id = asm.id) AS total_questions,
        TIMESTAMPDIFF(SECOND, att.started_at, att.submitted_at) AS time_taken_seconds
      FROM assessment_attempts att
      JOIN assessment_assignments ass ON att.assignment_id = ass.id
      JOIN assessments asm ON ass.assessment_id = asm.id
      LEFT JOIN categories c ON asm.category_id = c.id
      WHERE ass.candidate_id = ? AND att.status IN ('submitted', 'auto_submitted')
      ORDER BY att.submitted_at DESC
    `, [candidateId]);

    const history = rows.map(r => {
      const score = Number(r.score);
      const totalMarks = Number(r.total_marks);
      const passingMarks = Number(r.passing_marks);
      const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(1)) : 0;
      return {
        ...r,
        score,
        totalMarks,
        passingMarks,
        percentage,
        isPassed: score >= passingMarks
      };
    });

    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('Error fetching candidate history:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving history.' });
  }
};

// 9. Terminate Assessment due to Proctoring Violation
const terminateAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { reason } = req.body;

    const [attempts] = await pool.query(
      'SELECT att.id, att.status, att.assignment_id, ass.candidate_id FROM assessment_attempts att JOIN assessment_assignments ass ON att.assignment_id = ass.id WHERE att.id = ?',
      [attemptId]
    );

    if (attempts.length === 0) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    const attempt = attempts[0];

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Attempt is not in progress.' });
    }

    // Score what has been typed so far, then mark as terminated
    await calculateAndFinalizeAttempt(attemptId, 'terminated');

    await pool.query(
      'UPDATE assessment_attempts SET violation_reason = ?, is_terminated = 1 WHERE id = ?',
      [reason || 'Proctoring violation detected', attemptId]
    );

    return res.status(200).json({
      success: true,
      message: 'Assessment terminated due to proctoring violation.',
      attemptId: Number(attemptId)
    });
  } catch (error) {
    console.error('Error terminating assessment:', error);
    return res.status(500).json({ success: false, message: 'Server error terminating assessment.' });
  }
};

module.exports = {
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
  calculateAndFinalizeAttempt,
  terminateAttempt
};
