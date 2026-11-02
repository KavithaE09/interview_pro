const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'interviewpro_jwt_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 1. Candidate Registration
const register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Field validations
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All registration fields are required.' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Check for duplicate email
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [emailTrimmed]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user as candidate
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, "candidate")',
      [name.trim(), emailTrimmed, phone.trim(), passwordHash]
    );

    const newUser = {
      id: result.insertId,
      name: name.trim(),
      email: emailTrimmed,
      phone: phone.trim(),
      role: 'candidate'
    };

    // Auto-assign any active public published assessments to new candidate
    const [publishedAssessments] = await pool.query('SELECT id FROM assessments WHERE status = "published"');
    for (const asm of publishedAssessments) {
      await pool.query(
        'INSERT IGNORE INTO assessment_assignments (assessment_id, candidate_id, status) VALUES (?, ?, "assigned")',
        [asm.id, newUser.id]
      );
    }

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Candidate registration successful.',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// 2. User Login (Candidate & Admin)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [emailTrimmed]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    const token = generateToken(userPayload);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// 3. Get Current Profile
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user: rows[0] });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
  }
};

// 4. Update Profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name.trim(), phone.trim(), req.user.id]);

    const [rows] = await pool.query('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [req.user.id]);
    return res.status(200).json({ success: true, message: 'Profile updated successfully.', user: rows[0] });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

// 5. Administrator Registration
const registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const phoneTrimmed = phone && phone.trim() ? phone.trim() : '0000000000';

    // Check for duplicate email
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [emailTrimmed]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please sign in.' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user as admin
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, "admin")',
      [name.trim(), emailTrimmed, phoneTrimmed, passwordHash]
    );

    const newAdmin = {
      id: result.insertId,
      name: name.trim(),
      email: emailTrimmed,
      phone: phoneTrimmed,
      role: 'admin'
    };

    const token = generateToken(newAdmin);

    return res.status(201).json({
      success: true,
      message: 'Administrator registered successfully.',
      token,
      user: newAdmin
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during administrator registration.' });
  }
};

module.exports = {
  register,
  registerAdmin,
  login,
  getProfile,
  updateProfile
};
