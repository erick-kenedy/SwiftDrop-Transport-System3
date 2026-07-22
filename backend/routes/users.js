const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Get User Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [users] = await conn.query(
      'SELECT id, email, name, phone, role, profile_picture, rating, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    await conn.end();

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update User Profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, profile_picture } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      'UPDATE users SET name = ?, phone = ?, profile_picture = ?, updated_at = NOW() WHERE id = ?',
      [name, phone, profile_picture, req.user.id]
    );

    const [user] = await conn.query(
      'SELECT id, email, name, phone, role, profile_picture FROM users WHERE id = ?',
      [req.user.id]
    );
    await conn.end();

    res.json({ success: true, message: 'Profile updated', user: user[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get User Ratings
router.get('/ratings', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [ratings] = await conn.query(
      'SELECT * FROM ratings WHERE rated_user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    await conn.end();

    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
      : 0;

    res.json({ success: true, ratings, average: avgRating });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
