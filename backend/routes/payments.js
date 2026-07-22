const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Create Payment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { ride_id, amount, payment_method } = req.body;
    const conn = await pool.getConnection();

    const [result] = await conn.query(
      'INSERT INTO payments (ride_id, user_id, amount, payment_method, status, created_at) VALUES (?, ?, ?, ?, "pending", NOW())',
      [ride_id, req.user.id, amount, payment_method]
    );

    const [payment] = await conn.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
    await conn.end();

    res.status(201).json({ success: true, message: 'Payment created', payment: payment[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process Payment
router.post('/:id/process', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // In production, integrate with payment gateway
    await conn.query(
      'UPDATE payments SET status = "completed", processed_at = NOW() WHERE id = ?',
      [req.params.id]
    );

    const [payment] = await conn.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    await conn.end();

    res.json({ success: true, message: 'Payment processed', payment: payment[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Payment History
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [payments] = await conn.query(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    await conn.end();

    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
