const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

async function loadUserById(userId) {
  const result = await query(
    'SELECT id, first_name, last_name, email, username, role, is_active, deactivated_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

function toUserPayload(userRow) {
  return {
    id: userRow.id,
    fullName: `${userRow.first_name || ''} ${userRow.last_name || ''}`.trim(),
    firstName: userRow.first_name,
    lastName: userRow.last_name,
    email: userRow.email,
    username: userRow.username,
    role: userRow.role,
    profileImageUri: null,
    isActive: userRow.is_active,
    deactivatedAt: userRow.deactivated_at,
  };
}

function requireAuth(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: 'Missing auth token' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    return decoded;
  } catch (e) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return null;
  }
}

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { username, password } = req.body;
      const usernameOrEmail = String(username).trim();

      // Find user by username or email (case-insensitive)
      const result = await query(
        'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
        [usernameOrEmail]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const user = result.rows[0];

      // Check if user is active (existing schema uses boolean is_active)
      if (user.is_active === false) {
        return res.status(403).json({
          success: false,
          message: 'Account is not active',
        });
      }

      // Verify password
      if (!user.password) {
        return res.status(500).json({
          success: false,
          message: 'Account is misconfigured (missing password hash)',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '24h' }
      );

      // Return user data and token
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            fullName: `${user.first_name} ${user.last_name}`.trim(),
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            username: user.username,
            role: user.role,
            profileImageUri: null,
            isActive: user.is_active,
            deactivatedAt: user.deactivated_at,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', async (req, res) => {
  try {
    const decoded = requireAuth(req, res);
    if (!decoded) return;

    const user = await loadUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }

    return res.json({ success: true, data: toUserPayload(user) });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', async (req, res) => {
  try {
    const decoded = requireAuth(req, res);
    if (!decoded) return;

    const user = await loadUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Session refreshed',
      data: { user: toUserPayload(user), token },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ success: false, message: 'Failed to refresh session' });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (stateless for JWT)
 * @access  Private
 */
router.post('/logout', async (_req, res) => {
  return res.json({ success: true, message: 'Logged out', data: null });
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new patient
 * @access  Public
 */
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('username').trim().isLength({ min: 4 }).withMessage('Username must be at least 4 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { fullName, email, username, password } = req.body;

      // Split fullName into first and last name
      const nameParts = String(fullName).trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check if user exists
      const existing = await query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'User already exists',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user (default role: patient)
      const result = await query(
        `INSERT INTO users 
          (first_name, last_name, email, username, password, role, is_active, deactivated_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'patient', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, first_name, last_name, email, username, role, is_active, deactivated_at, created_at`,
        [firstName, lastName, email, username, passwordHash]
      );

      const user = result.rows[0];

      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: user.id,
            fullName: `${user.first_name} ${user.last_name}`.trim(),
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            username: user.username,
            role: user.role,
            profileImageUri: null,
            isActive: user.is_active,
            deactivatedAt: user.deactivated_at,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message,
      });
    }
  }
);

module.exports = router;
