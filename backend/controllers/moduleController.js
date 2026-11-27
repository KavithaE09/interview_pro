const pool = require('../config/db');

// Helper to format video or course URLs (YouTube, Vimeo, Udemy, Website courses)
const formatYouTubeEmbed = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed;
  }
  // Standard watch URL: youtube.com/watch?v=VIDEO_ID or youtu.be/VIDEO_ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  // Vimeo URL
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
  }
  // Any website, Udemy course, or external learning URL
  return trimmed;
};

// 1. Get All Learning Modules (Optionally with candidate completion status)
const getModules = async (req, res) => {
  try {
    const candidateId = req.user?.role === 'candidate' ? req.user.id : (req.query.candidateId || null);

    let query = `
      SELECT 
        m.id,
        m.title,
        m.description,
        m.category_id,
        c.category_name,
        m.assessment_id,
        a.title AS assessment_title,
        m.video_url,
        m.resource_url,
        m.file_name,
        m.order_index,
        m.created_at
    `;

    if (candidateId) {
      query += `,
        COALESCE(cmp.is_completed, 0) AS is_completed,
        cmp.completed_at
      FROM modules m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN assessments a ON m.assessment_id = a.id
      LEFT JOIN candidate_module_progress cmp ON cmp.module_id = m.id AND cmp.candidate_id = ?
      ORDER BY m.order_index ASC, m.id ASC
      `;
      const [rows] = await pool.query(query, [candidateId]);
      return res.json({ success: true, modules: rows });
    } else {
      query += `
      FROM modules m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN assessments a ON m.assessment_id = a.id
      ORDER BY m.order_index ASC, m.id ASC
      `;
      const [rows] = await pool.query(query);
      return res.json({ success: true, modules: rows });
    }
  } catch (error) {
    console.error('Error fetching modules:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching modules.' });
  }
};

// 2. Get Single Module
const getModuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user?.id || null;

    const [rows] = await pool.query(`
      SELECT 
        m.*,
        c.category_name,
        a.title AS assessment_title,
        COALESCE(cmp.is_completed, 0) AS is_completed,
        cmp.completed_at
      FROM modules m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN assessments a ON m.assessment_id = a.id
      LEFT JOIN candidate_module_progress cmp ON cmp.module_id = m.id AND cmp.candidate_id = ?
      WHERE m.id = ?
    `, [candidateId, id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    return res.json({ success: true, module: rows[0] });
  } catch (error) {
    console.error('Error fetching module:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching module.' });
  }
};

// 3. Create Learning Module (Admin Only)
const createModule = async (req, res) => {
  try {
    const {
      title,
      description = '',
      category_id = null,
      assessment_id = null,
      video_url,
      resource_url = '',
      file_name = '',
      order_index = 1
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Module title is required.' });
    }

    if (!video_url || !video_url.trim()) {
      return res.status(400).json({ success: false, message: 'Learning URL (YouTube, Udemy, course, or website link) is required.' });
    }

    const formattedVideo = formatYouTubeEmbed(video_url);

    const [result] = await pool.query(`
      INSERT INTO modules (title, description, category_id, assessment_id, video_url, resource_url, file_name, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      description.trim(),
      category_id ? Number(category_id) : null,
      assessment_id ? Number(assessment_id) : null,
      formattedVideo,
      (resource_url || '').trim(),
      (file_name || '').trim(),
      Number(order_index) || 1
    ]);

    return res.status(201).json({
      success: true,
      message: 'Learning module created successfully.',
      moduleId: result.insertId
    });
  } catch (error) {
    console.error('Error creating module:', error);
    return res.status(500).json({ success: false, message: 'Server error creating module.' });
  }
};

// 4. Update Learning Module (Admin Only)
const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description = '',
      category_id = null,
      assessment_id = null,
      video_url,
      resource_url = '',
      file_name = '',
      order_index = 1
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Module title is required.' });
    }

    if (!video_url || !video_url.trim()) {
      return res.status(400).json({ success: false, message: 'Learning URL (YouTube, Udemy, course, or website link) is required.' });
    }

    const formattedVideo = formatYouTubeEmbed(video_url);

    await pool.query(`
      UPDATE modules
      SET title = ?,
          description = ?,
          category_id = ?,
          assessment_id = ?,
          video_url = ?,
          resource_url = ?,
          file_name = ?,
          order_index = ?
      WHERE id = ?
    `, [
      title.trim(),
      description.trim(),
      category_id ? Number(category_id) : null,
      assessment_id ? Number(assessment_id) : null,
      formattedVideo,
      (resource_url || '').trim(),
      (file_name || '').trim(),
      Number(order_index) || 1,
      id
    ]);

    return res.json({ success: true, message: 'Learning module updated successfully.' });
  } catch (error) {
    console.error('Error updating module:', error);
    return res.status(500).json({ success: false, message: 'Server error updating module.' });
  }
};

// 5. Delete Learning Module (Admin Only)
const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM modules WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Module deleted successfully.' });
  } catch (error) {
    console.error('Error deleting module:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting module.' });
  }
};

// 6. Mark Module Completed / Watched (Candidate)
const markModuleCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    await pool.query(`
      INSERT INTO candidate_module_progress (candidate_id, module_id, is_completed, completed_at)
      VALUES (?, ?, 1, NOW())
      ON DUPLICATE KEY UPDATE is_completed = 1, completed_at = NOW()
    `, [candidateId, id]);

    return res.json({ success: true, message: 'Module marked as completed!' });
  } catch (error) {
    console.error('Error marking module completed:', error);
    return res.status(500).json({ success: false, message: 'Server error saving module progress.' });
  }
};

// 7. Get Candidate Dashboard Full Data
const getCandidateDashboardData = async (req, res) => {
  try {
    const candidateId = req.user.id;

    // A. Candidate Profile with Category
    const [userRows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.category_id, c.category_name 
      FROM users u
      LEFT JOIN categories c ON u.category_id = c.id
      WHERE u.id = ?
    `, [candidateId]);

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate account not found.' });
    }
    const candidate = userRows[0];

    // Ensure candidate has assignments for all published assessments in their chosen category
    if (candidate.category_id) {
      const [publishedCatAsms] = await pool.query(
        'SELECT id FROM assessments WHERE status = "published" AND category_id = ?',
        [candidate.category_id]
      );
      for (const asm of publishedCatAsms) {
        await pool.query(
          'INSERT IGNORE INTO assessment_assignments (assessment_id, candidate_id, status) VALUES (?, ?, "assigned")',
          [asm.id, candidateId]
        );
      }
    }

    // B. Modules with Candidate Progress (Filtered by candidate's chosen category if selected)
    let moduleWhere = '';
    const moduleParams = [candidateId];
    if (candidate.category_id) {
      moduleWhere = 'WHERE (m.category_id = ? OR m.category_id IS NULL)';
      moduleParams.push(candidate.category_id);
    }

    const [modules] = await pool.query(`
      SELECT 
        m.id,
        m.title,
        m.description,
        m.category_id,
        c.category_name,
        m.assessment_id,
        a.title AS assessment_title,
        m.video_url,
        m.resource_url,
        m.file_name,
        m.order_index,
        COALESCE(cmp.is_completed, 0) AS is_completed,
        cmp.completed_at
      FROM modules m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN assessments a ON m.assessment_id = a.id
      LEFT JOIN candidate_module_progress cmp ON cmp.module_id = m.id AND cmp.candidate_id = ?
      ${moduleWhere}
      ORDER BY m.order_index ASC, m.id ASC
    `, moduleParams);

    // C. Assigned Assessments with Category, Question Count & Attempt Status
    // Filter strictly to the candidate's chosen category
    let asmWhere = 'WHERE aa.candidate_id = ? AND a.status = "published"';
    const asmParams = [candidateId];
    if (candidate.category_id) {
      asmWhere += ' AND a.category_id = ?';
      asmParams.push(candidate.category_id);
    }

    const [assignments] = await pool.query(`
      SELECT 
        aa.id AS assignment_id,
        aa.assessment_id,
        aa.status AS assignment_status,
        aa.assigned_at,
        a.title,
        a.description,
        a.duration_minutes,
        a.total_marks,
        a.passing_marks,
        a.status AS assessment_status,
        c.id AS category_id,
        c.category_name,
        (SELECT COUNT(*) FROM questions q WHERE q.assessment_id = a.id) AS question_count,
        att.id AS latest_attempt_id,
        att.status AS attempt_status,
        att.score,
        att.submitted_at
      FROM assessment_assignments aa
      JOIN assessments a ON aa.assessment_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN (
        SELECT assignment_id, MAX(id) AS max_id 
        FROM assessment_attempts 
        GROUP BY assignment_id
      ) latest_att ON latest_att.assignment_id = aa.id
      LEFT JOIN assessment_attempts att ON att.id = latest_att.max_id
      ${asmWhere}
      ORDER BY aa.assigned_at DESC, a.id DESC
    `, asmParams);

    return res.json({
      success: true,
      candidate,
      modules,
      assessments: assignments
    });
  } catch (error) {
    console.error('Error fetching candidate dashboard data:', error);
    return res.status(500).json({ success: false, message: 'Server error loading candidate dashboard.' });
  }
};

// 8. Upload Module Resource File (CheatSheet, PDF, Excel, Document, etc.)
const uploadModuleResource = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileSizeFormatted = req.file.size > 1024 * 1024
      ? (req.file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (req.file.size / 1024).toFixed(1) + ' KB';

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully!',
      file_url: fileUrl,
      file_name: req.file.originalname,
      file_size: fileSizeFormatted
    });
  } catch (err) {
    console.error('Error in uploadModuleResource:', err);
    return res.status(500).json({ success: false, message: 'Server error while uploading resource file.' });
  }
};

module.exports = {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  markModuleCompleted,
  getCandidateDashboardData,
  uploadModuleResource
};
