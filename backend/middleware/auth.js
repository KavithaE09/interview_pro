const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'interviewpro_jwt_secret');

    // Verify user exists in database
    const [rows] = await pool.query('SELECT id, name, email, phone, role FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User account no longer exists.' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(403).json({ success: false, message: 'Invalid or forged authentication token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
};

const requireCandidate = (req, res, next) => {
  if (req.user && req.user.role === 'candidate') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Candidate privileges required.' });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCandidate
};
