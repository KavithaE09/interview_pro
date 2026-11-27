const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    
    const [candRows] = await pool.query('SELECT COUNT(*) AS total_candidates FROM users WHERE role = "candidate"');
    const totalCandidates = candRows[0].total_candidates;
    const [asmRows] = await pool.query('SELECT COUNT(*) AS total_assessments FROM assessments');
    const totalAssessments = asmRows[0].total_assessments;
    const [compRows] = await pool.query('SELECT COUNT(*) AS completed FROM assessment_attempts WHERE status IN ("submitted", "auto_submitted")');
    const completedAttempts = compRows[0].completed;
    const [progRows] = await pool.query('SELECT COUNT(*) AS in_progress FROM assessment_attempts WHERE status = "in_progress"');
    const inProgressAttempts = progRows[0].in_progress;

    // Average score of completed assessments
    const [avgRows] = await pool.query('SELECT COALESCE(AVG(score), 0) AS avg_score FROM assessment_attempts WHERE status IN ("submitted", "auto_submitted")');
    const avgScore = Number(Number(avgRows[0].avg_score).toFixed(2));

    // Recent attempts list
    const [recentAttempts] = await pool.query(`
      SELECT 
        att.id AS attempt_id, att.started_at, att.submitted_at, att.score, att.status,
        u.name AS candidate_name, u.email AS candidate_email,
        asm.title AS assessment_title, asm.total_marks, asm.passing_marks,
        c.category_name
      FROM assessment_attempts att
      JOIN assessment_assignments ass ON att.assignment_id = ass.id
      JOIN users u ON ass.candidate_id = u.id
      JOIN assessments asm ON ass.assessment_id = asm.id
      LEFT JOIN categories c ON asm.category_id = c.id
      ORDER BY att.id DESC LIMIT 8
    `);

    return res.status(200).json({
      success: true,
      stats: {
        totalCandidates,
        totalAssessments,
        completedAttempts,
        inProgressAttempts,
        avgScore
      },
      recentAttempts
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving dashboard statistics.' });
  }
};

// ==========================================
// 2. Category Management
// ==========================================
const getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM assessments a WHERE a.category_id = c.id) AS assessment_count
      FROM categories c
      ORDER BY c.category_name ASC
    `);
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching categories.' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;
    if (!category_name || !category_name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (category_name, description) VALUES (?, ?)',
      [category_name.trim(), description ? description.trim() : '']
    );

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: {
        id: result.insertId,
        category_name: category_name.trim(),
        description: description || ''
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ success: false, message: 'Server error creating category.' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description } = req.body;

    if (!category_name || !category_name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    await pool.query(
      'UPDATE categories SET category_name = ?, description = ? WHERE id = ?',
      [category_name.trim(), description || '', id]
    );

    return res.status(200).json({ success: true, message: 'Category updated successfully.' });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ success: false, message: 'Server error updating category.' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting category.' });
  }
};

// ==========================================
// 3. Assessment Management
// ==========================================
const getAllAssessments = async (req, res) => {
  try {
    const [assessments] = await pool.query(`
      SELECT 
        a.*,
        c.category_name,
        (SELECT COUNT(*) FROM questions q WHERE q.assessment_id = a.id) AS question_count,
        (SELECT COUNT(*) FROM assessment_assignments ass WHERE ass.assessment_id = a.id) AS assigned_count,
        (SELECT COUNT(*) FROM assessment_attempts att JOIN assessment_assignments ass ON att.assignment_id = ass.id WHERE ass.assessment_id = a.id AND att.status IN ('submitted', 'auto_submitted')) AS completed_count
      FROM assessments a
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY a.id DESC
    `);
    return res.status(200).json({ success: true, assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching assessments.' });
  }
};

const getAssessmentDetailsWithQuestions = async (req, res) => {
  try {
    const { id } = req.params;

    const [assessments] = await pool.query(`
      SELECT a.*, c.category_name
      FROM assessments a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [id]);

    if (assessments.length === 0) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const assessment = assessments[0];

    const [questions] = await pool.query(`
      SELECT id, question_text, marks, question_order, explanation, expected_keywords, question_type
      FROM questions
      WHERE assessment_id = ?
      ORDER BY question_order ASC, id ASC
    `, [id]);

    for (const q of questions) {
      const [options] = await pool.query(`
        SELECT id, question_id, option_text, is_correct
        FROM question_options
        WHERE question_id = ?
        ORDER BY id ASC
      `, [q.id]);
      q.options = options;
      if (options.length === 0) {
        q.question_type = 'text';
      }
    }

    assessment.questions = questions;

    return res.status(200).json({ success: true, assessment });
  } catch (error) {
    console.error('Error fetching assessment details:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching assessment details.' });
  }
};

const createAssessment = async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      duration_minutes = 30,
      total_marks = 100,
      passing_marks = 40,
      available_from = null,
      available_until = null,
      status = 'published',
      allow_view_answers = 1
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment title is required.' });
    }

    const [result] = await pool.query(`
      INSERT INTO assessments (category_id, title, description, duration_minutes, total_marks, passing_marks, available_from, available_until, status, allow_view_answers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      category_id ? Number(category_id) : null,
      title.trim(),
      description || '',
      Number(duration_minutes) || 30,
      Number(total_marks) || 100,
      Number(passing_marks) || 40,
      available_from || null,
      available_until || null,
      status || 'published',
      allow_view_answers ? 1 : 0
    ]);

    return res.status(201).json({
      success: true,
      message: 'Assessment created successfully.',
      assessmentId: result.insertId
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return res.status(500).json({ success: false, message: 'Server error creating assessment.' });
  }
};

const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category_id,
      duration_minutes,
      total_marks,
      passing_marks,
      available_from,
      available_until,
      status,
      allow_view_answers
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment title is required.' });
    }

    await pool.query(`
      UPDATE assessments
      SET 
        category_id = ?,
        title = ?,
        description = ?,
        duration_minutes = ?,
        total_marks = ?,
        passing_marks = ?,
        available_from = ?,
        available_until = ?,
        status = ?,
        allow_view_answers = ?
      WHERE id = ?
    `, [
      category_id ? Number(category_id) : null,
      title.trim(),
      description || '',
      Number(duration_minutes) || 30,
      Number(total_marks) || 100,
      Number(passing_marks) || 40,
      available_from || null,
      available_until || null,
      status || 'published',
      allow_view_answers ? 1 : 0,
      id
    ]);

    return res.status(200).json({ success: true, message: 'Assessment updated successfully.' });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return res.status(500).json({ success: false, message: 'Server error updating assessment.' });
  }
};

const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM assessments WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Assessment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting assessment.' });
  }
};

const togglePublishAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT status FROM assessments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const nextStatus = rows[0].status === 'published' ? 'draft' : 'published';
    await pool.query('UPDATE assessments SET status = ? WHERE id = ?', [nextStatus, id]);

    return res.status(200).json({
      success: true,
      message: `Assessment ${nextStatus === 'published' ? 'published' : 'unpublished'} successfully.`,
      status: nextStatus
    });
  } catch (error) {
    console.error('Error toggling assessment publish:', error);
    return res.status(500).json({ success: false, message: 'Server error toggling status.' });
  }
};

// ==========================================
// 4. Question Management
// ==========================================
const addQuestion = async (req, res) => {
  try {
    const {
      assessment_id,
      question_text,
      marks = 10,
      question_order = 1,
      explanation = '',
      expected_keywords = '',
      question_type = 'mcq',
      options = []
    } = req.body;

    if (!assessment_id || !question_text || !question_text.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment ID and question text are required.' });
    }

    let kw = expected_keywords;
    if (Array.isArray(kw)) {
      kw = kw.join(', ');
    }

    const type = question_type === 'text' ? 'text' : 'mcq';

    const [qResult] = await pool.query(`
      INSERT INTO questions (assessment_id, question_text, marks, question_order, explanation, expected_keywords, question_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      assessment_id,
      question_text.trim(),
      Number(marks) || 10,
      Number(question_order) || 1,
      explanation || '',
      kw ? String(kw).trim() : null,
      type
    ]);

    const questionId = qResult.insertId;

    // If MCQ and options provided, insert options
    if (type === 'mcq' && Array.isArray(options) && options.length > 0) {
      for (const opt of options) {
        if (opt.option_text && opt.option_text.trim()) {
          await pool.query(`
            INSERT INTO question_options (question_id, option_text, is_correct)
            VALUES (?, ?, ?)
          `, [
            questionId,
            opt.option_text.trim(),
            opt.is_correct ? 1 : 0
          ]);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Question added successfully.',
      questionId
    });
  } catch (error) {
    console.error('Error adding question:', error);
    return res.status(500).json({ success: false, message: 'Server error adding question.' });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      question_text,
      marks,
      question_order,
      explanation,
      expected_keywords,
      question_type = 'mcq',
      options = []
    } = req.body;

    if (!question_text || !question_text.trim()) {
      return res.status(400).json({ success: false, message: 'Question text is required.' });
    }

    let kw = expected_keywords;
    if (Array.isArray(kw)) {
      kw = kw.join(', ');
    }

    const type = question_type === 'text' ? 'text' : 'mcq';

    await pool.query(`
      UPDATE questions
      SET
        question_text = ?,
        marks = ?,
        question_order = ?,
        explanation = ?,
        expected_keywords = ?,
        question_type = ?
      WHERE id = ?
    `, [
      question_text.trim(),
      Number(marks) || 10,
      Number(question_order) || 1,
      explanation || '',
      kw !== undefined ? (kw ? String(kw).trim() : null) : null,
      type,
      id
    ]);

    // Update options: delete existing options and insert updated ones if type === 'mcq'
    await pool.query('DELETE FROM question_options WHERE question_id = ?', [id]);
    if (type === 'mcq' && Array.isArray(options) && options.length > 0) {
      for (const opt of options) {
        if (opt.option_text && opt.option_text.trim()) {
          await pool.query(`
            INSERT INTO question_options (question_id, option_text, is_correct)
            VALUES (?, ?, ?)
          `, [
            id,
            opt.option_text.trim(),
            opt.is_correct ? 1 : 0
          ]);
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Question updated successfully.' });
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ success: false, message: 'Server error updating question.' });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM questions WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Question deleted successfully.' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting question.' });
  }
};

// ==========================================
// 5. Candidate Management
// ==========================================
const getAllCandidates = async (req, res) => {
  try {
    const { search = '' } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.created_at,
        (SELECT COUNT(*) FROM assessment_assignments ass WHERE ass.candidate_id = u.id) AS assigned_count,
        (SELECT COUNT(*) FROM assessment_attempts att JOIN assessment_assignments ass ON att.assignment_id = ass.id WHERE ass.candidate_id = u.id AND att.status IN ('submitted', 'auto_submitted')) AS completed_count,
        (SELECT COALESCE(AVG(att.score), 0) FROM assessment_attempts att JOIN assessment_assignments ass ON att.assignment_id = ass.id WHERE ass.candidate_id = u.id AND att.status IN ('submitted', 'auto_submitted')) AS avg_score
      FROM users u
      WHERE u.role = 'candidate'
    `;
    const params = [];

    if (search.trim()) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY u.id DESC`;

    const [candidates] = await pool.query(query, params);

    return res.status(200).json({ success: true, candidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching candidates.' });
  }
};

const getCandidateDetailWithHistory = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const [userRows] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? AND role = "candidate"',
      [candidateId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    const candidate = userRows[0];

    // Fetch candidate assessment attempts
    const [attempts] = await pool.query(`
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
        (SELECT COUNT(*) FROM questions q WHERE q.assessment_id = asm.id) AS total_questions
      FROM assessment_attempts att
      JOIN assessment_assignments ass ON att.assignment_id = ass.id
      JOIN assessments asm ON ass.assessment_id = asm.id
      LEFT JOIN categories c ON asm.category_id = c.id
      WHERE ass.candidate_id = ?
      ORDER BY att.id DESC
    `, [candidateId]);

    candidate.history = attempts.map(a => {
      const score = Number(a.score);
      const totalMarks = Number(a.total_marks);
      const passingMarks = Number(a.passing_marks);
      const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(1)) : 0;
      return {
        ...a,
        score,
        totalMarks,
        passingMarks,
        percentage,
        isPassed: score >= passingMarks
      };
    });

    return res.status(200).json({ success: true, candidate });
  } catch (error) {
    console.error('Error fetching candidate history:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving candidate profile.' });
  }
};

const assignAssessmentToCandidates = async (req, res) => {
  try {
    const { assessmentId, candidateIds = [] } = req.body;

    if (!assessmentId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Assessment ID and at least one candidate ID are required.' });
    }

    let assignedCount = 0;
    for (const candId of candidateIds) {
      const [res] = await pool.query(`
        INSERT INTO assessment_assignments (assessment_id, candidate_id, status)
        VALUES (?, ?, 'assigned')
        ON DUPLICATE KEY UPDATE status = status
      `, [assessmentId, candId]);

      if (res.affectedRows > 0) assignedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Assessment successfully assigned to ${candidateIds.length} candidate(s).`
    });
  } catch (error) {
    console.error('Error assigning assessment:', error);
    return res.status(500).json({ success: false, message: 'Server error assigning assessment.' });
  }
};

const assignCategoryToCandidates = async (req, res) => {
  try {
    const { categoryId, candidateIds = [] } = req.body;

    if (!categoryId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Category ID and candidate IDs are required.' });
    }

    // Find all published assessments in this category
    const [assessments] = await pool.query(
      'SELECT id, title FROM assessments WHERE category_id = ? AND status = "published"',
      [categoryId]
    );

    if (assessments.length === 0) {
      return res.status(400).json({ success: false, message: 'No published assessments found in this category.' });
    }

    let totalAssignments = 0;
    for (const candId of candidateIds) {
      for (const asm of assessments) {
        const [result] = await pool.query(`
          INSERT INTO assessment_assignments (assessment_id, candidate_id, status)
          VALUES (?, ?, 'assigned')
          ON DUPLICATE KEY UPDATE status = status
        `, [asm.id, candId]);
        if (result.affectedRows > 0) totalAssignments++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Assigned ${assessments.length} assessment(s) in this category to ${candidateIds.length} candidate(s).`
    });
  } catch (error) {
    console.error('Error assigning category to candidates:', error);
    return res.status(500).json({ success: false, message: 'Server error assigning category to candidates.' });
  }
};

// ==========================================
// 6. Results Management
// ==========================================
const getAllResults = async (req, res) => {
  try {
    const { assessmentId, search = '' } = req.query;

    let query = `
      SELECT 
        att.id AS attempt_id,
        att.started_at,
        att.submitted_at,
        att.score,
        att.status AS attempt_status,
        u.id AS candidate_id,
        u.name AS candidate_name,
        u.email AS candidate_email,
        asm.id AS assessment_id,
        asm.title AS assessment_title,
        asm.total_marks,
        asm.passing_marks,
        c.category_name,
        (SELECT COUNT(*) FROM questions q WHERE q.assessment_id = asm.id) AS total_questions,
        TIMESTAMPDIFF(SECOND, att.started_at, att.submitted_at) AS time_taken_seconds
      FROM assessment_attempts att
      JOIN assessment_assignments ass ON att.assignment_id = ass.id
      JOIN users u ON ass.candidate_id = u.id
      JOIN assessments asm ON ass.assessment_id = asm.id
      LEFT JOIN categories c ON asm.category_id = c.id
      WHERE att.status IN ('submitted', 'auto_submitted')
    `;

    const params = [];

    if (assessmentId) {
      query += ` AND asm.id = ?`;
      params.push(assessmentId);
    }

    if (search.trim()) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ` ORDER BY att.submitted_at DESC`;

    const [rows] = await pool.query(query, params);

    // Calculate answers breakdown for each attempt
    const results = await Promise.all(rows.map(async (row) => {
      const [questions] = await pool.query(`
        SELECT q.id, q.marks
        FROM questions q
        WHERE q.assessment_id = ?
      `, [row.assessment_id]);

      const [answers] = await pool.query(`
        SELECT question_id, answer_text, score_awarded
        FROM candidate_answers
        WHERE attempt_id = ?
      `, [row.attempt_id]);

      const ansMap = {};
      answers.forEach(a => {
        ansMap[a.question_id] = a;
      });

      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;

      questions.forEach(q => {
        const a = ansMap[q.id];
        if (!a || !a.answer_text || a.answer_text.trim().length === 0) {
          unansweredCount++;
        } else if (Number(a.score_awarded) >= (Number(q.marks) * 0.5)) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      });

      const score = Number(row.score);
      const totalMarks = Number(row.total_marks);
      const passingMarks = Number(row.passing_marks);
      const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(1)) : 0;

      return {
        ...row,
        score,
        totalMarks,
        passingMarks,
        percentage,
        isPassed: score >= passingMarks,
        totalQuestions: questions.length,
        answeredCount: questions.length - unansweredCount,
        correctCount,
        incorrectCount,
        unansweredCount
      };
    }));

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Error fetching results:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching assessment results.' });
  }
};

module.exports = {
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
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getAllCandidates,
  getCandidateDetailWithHistory,
  assignAssessmentToCandidates,
  assignCategoryToCandidates,
  getAllResults
};
