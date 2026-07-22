const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Get Driver Profile
router.get('/profile', authMiddleware, roleMiddleware(['driver']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [driver] = await conn.query(
      'SELECT * FROM drivers WHERE user_id = ?',
      [req.user.id]
    );
    await conn.end();

    if (driver.length === 0) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    res.json({ success: true, driver: driver[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Driver Status
router.put('/status', authMiddleware, roleMiddleware(['driver']), async (req, res) => {
  try {
    const { status } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      'UPDATE drivers SET status = ?, updated_at = NOW() WHERE user_id = ?',
      [status, req.user.id]
    );

    const [driver] = await conn.query('SELECT * FROM drivers WHERE user_id = ?', [req.user.id]);
    await conn.end();

    res.json({ success: true, message: 'Status updated', driver: driver[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Driver Earnings
router.get('/earnings', authMiddleware, roleMiddleware(['driver']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [earnings] = await conn.query(
      'SELECT SUM(total_amount) as total_earnings, COUNT(*) as completed_rides FROM rides WHERE driver_id = ? AND status = "completed"',
      [req.user.id]
    );
    await conn.end();

    res.json({ success: true, earnings: earnings[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Available Rides
router.get('/available-rides', authMiddleware, roleMiddleware(['driver']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rides] = await conn.query(
      'SELECT r.*, u.name as customer_name, u.phone FROM rides r JOIN users u ON r.customer_id = u.id WHERE r.status = "pending" ORDER BY r.created_at DESC LIMIT 50'
    );
    await conn.end();

    res.json({ success: true, rides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
