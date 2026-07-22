const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateEmail, validatePassword } = require('../middleware/validation');
const pool = require('../config/database');

const router = express.Router();

// Register User
router.post('/register', validateEmail, validatePassword, async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;
    const conn = await pool.getConnection();

    // Check if user exists
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.end();
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await conn.query(
      'INSERT INTO users (email, password, name, phone, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [email, hashedPassword, name, phone, role || 'customer']
    );

    const [user] = await conn.query('SELECT id, email, name, role FROM users WHERE email = ?', [email]);
    const token = jwt.sign(
      { id: user[0].id, email: user[0].email, role: user[0].role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    await conn.end();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Login
router.post('/login', validateEmail, async (req, res) => {
  try {
    const { email, password } = req.body;
    const conn = await pool.getConnection();

    const [users] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      await conn.end();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await conn.end();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    await conn.end();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify Token
router.post('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
});

module.exports = router;
