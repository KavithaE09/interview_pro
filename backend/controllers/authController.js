const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { validateEmail, validatePhone } = require('../utils/validators');

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
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ success: false, message: emailValidation.message });
    }
    const emailTrimmed = emailValidation.email;

    const phoneValidation = validatePhone(phone, false);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ success: false, message: phoneValidation.message });
    }
    const validatedPhone = phoneValidation.phone;

    if (!password || password.length < 6) {
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
      [name.trim(), emailTrimmed, validatedPhone, passwordHash]
    );

    const newUser = {
      id: result.insertId,
      name: name.trim(),
      email: emailTrimmed,
      phone: validatedPhone,
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

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ success: false, message: emailValidation.message });
    }
    const emailTrimmed = emailValidation.email;

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
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    let validatedPhone = null;
    if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
      const phoneValidation = validatePhone(phone, false);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ success: false, message: phoneValidation.message });
      }
      validatedPhone = phoneValidation.phone;
    }

    await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [
      name.trim(),
      validatedPhone,
      req.user.id
    ]);

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

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Administrator full name is required.' });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ success: false, message: emailValidation.message });
    }
    const emailTrimmed = emailValidation.email;

    // Admin phone validation (optional or if provided must be valid)
    const phoneValidation = validatePhone(phone, false);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ success: false, message: phoneValidation.message });
    }
    const validatedPhone = phoneValidation.phone;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

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
      [name.trim(), emailTrimmed, validatedPhone, passwordHash]
    );

    const newAdmin = {
      id: result.insertId,
      name: name.trim(),
      email: emailTrimmed,
      phone: validatedPhone,
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

// Candidate Quick Login (No registration or password needed - just Name & Email, Phone is Optional)
const candidateLogin = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Candidate full name is required.' });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ success: false, message: emailValidation.message });
    }
    const emailTrimmed = emailValidation.email;

    if (!emailTrimmed.endsWith('@gmail.com')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid Gmail address (must end with @gmail.com).' 
      });
    }
    const nameTrimmed = name.trim();

    // Mobile number validation: optional, but if entered, must be a valid 10-digit number
    const phoneValidation = validatePhone(phone, false);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ success: false, message: phoneValidation.message });
    }
    const validatedPhone = phoneValidation.phone; // valid 10-digit string OR null

    // Check if candidate exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [emailTrimmed]);
    let candidateUser;

    if (existing.length > 0) {
      candidateUser = existing[0];
      // Only update phone if candidate explicitly entered a valid phone number
      if (validatedPhone) {
        await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [
          nameTrimmed,
          validatedPhone,
          candidateUser.id
        ]);
        candidateUser.phone = validatedPhone;
      } else {
        await pool.query('UPDATE users SET name = ? WHERE id = ?', [
          nameTrimmed,
          candidateUser.id
        ]);
      }
      candidateUser.name = nameTrimmed;
    } else {
      const [insertResult] = await pool.query(
        'INSERT INTO users (name, email, phone, role) VALUES (?, ?, ?, "candidate")',
        [nameTrimmed, emailTrimmed, validatedPhone]
      );
      candidateUser = {
        id: insertResult.insertId,
        name: nameTrimmed,
        email: emailTrimmed,
        phone: validatedPhone,
        role: 'candidate'
      };

      // Auto-assign any active published assessments to new candidate
      const [publishedAssessments] = await pool.query('SELECT id FROM assessments WHERE status = "published"');
      for (const asm of publishedAssessments) {
        await pool.query(
          'INSERT IGNORE INTO assessment_assignments (assessment_id, candidate_id, status) VALUES (?, ?, "assigned")',
          [asm.id, candidateUser.id]
        );
      }
    }

    const userPayload = {
      id: candidateUser.id,
      name: candidateUser.name,
      email: candidateUser.email,
      phone: candidateUser.phone,
      role: 'candidate'
    };

    const token = generateToken(userPayload);

    return res.status(200).json({
      success: true,
      message: 'Candidate session started successfully.',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Candidate login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during candidate login.' });
  }
};

module.exports = {
  register,
  registerAdmin,
  login,
  candidateLogin,
  getProfile,
  updateProfile
};
