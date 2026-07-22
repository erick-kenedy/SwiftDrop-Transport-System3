const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Create Ride
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { pickup_location, dropoff_location, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, ride_type } = req.body;
    const conn = await pool.getConnection();

    const [result] = await conn.query(
      'INSERT INTO rides (customer_id, pickup_location, dropoff_location, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, ride_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "pending", NOW())',
      [req.user.id, pickup_location, dropoff_location, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, ride_type]
    );

    const [ride] = await conn.query('SELECT * FROM rides WHERE id = ?', [result.insertId]);
    await conn.end();

    res.status(201).json({ success: true, message: 'Ride created', ride: ride[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Ride Details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [ride] = await conn.query(
      'SELECT r.*, u.name as customer_name, u.phone as customer_phone, d.name as driver_name FROM rides r LEFT JOIN users u ON r.customer_id = u.id LEFT JOIN users d ON r.driver_id = d.id WHERE r.id = ?',
      [req.params.id]
    );
    await conn.end();

    if (ride.length === 0) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    res.json({ success: true, ride: ride[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Accept Ride
router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();

    await conn.query(
      'UPDATE rides SET driver_id = ?, status = "accepted", accepted_at = NOW() WHERE id = ?',
      [req.user.id, req.params.id]
    );

    const [ride] = await conn.query('SELECT * FROM rides WHERE id = ?', [req.params.id]);
    await conn.end();

    res.json({ success: true, message: 'Ride accepted', ride: ride[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Complete Ride
router.put('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { total_amount } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      'UPDATE rides SET status = "completed", completed_at = NOW(), total_amount = ? WHERE id = ?',
      [total_amount, req.params.id]
    );

    const [ride] = await conn.query('SELECT * FROM rides WHERE id = ?', [req.params.id]);
    await conn.end();

    res.json({ success: true, message: 'Ride completed', ride: ride[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
