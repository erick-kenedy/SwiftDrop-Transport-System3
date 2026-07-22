const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Get All Users
router.get('/users', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [users] = await conn.query(
      'SELECT id, email, name, phone, role, rating, created_at FROM users ORDER BY created_at DESC'
    );
    await conn.end();

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Drivers
router.get('/drivers', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [drivers] = await conn.query(
      'SELECT d.*, u.name, u.email, u.phone FROM drivers d JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC'
    );
    await conn.end();

    res.json({ success: true, drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Dashboard Stats
router.get('/stats', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    const [totalUsers] = await conn.query('SELECT COUNT(*) as count FROM users');
    const [totalDrivers] = await conn.query('SELECT COUNT(*) as count FROM drivers');
    const [completedRides] = await conn.query('SELECT COUNT(*) as count FROM rides WHERE status = "completed"');
    const [totalRevenue] = await conn.query('SELECT SUM(amount) as total FROM payments WHERE status = "completed"');

    await conn.end();

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers[0].count,
        totalDrivers: totalDrivers[0].count,
        completedRides: completedRides[0].count,
        totalRevenue: totalRevenue[0].total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Rides
router.get('/rides', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rides] = await conn.query(
      'SELECT r.*, u.name as customer_name, d.name as driver_name FROM rides r JOIN users u ON r.customer_id = u.id LEFT JOIN users d ON r.driver_id = d.id ORDER BY r.created_at DESC LIMIT 100'
    );
    await conn.end();

    res.json({ success: true, rides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
