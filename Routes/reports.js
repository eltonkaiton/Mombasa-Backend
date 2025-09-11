import express from 'express';
import Payment from '../models/Payment.js';
import Supply from '../models/Supply.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// GET /api/reports/payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ created_at: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment reports' });
  }
});

// GET /api/reports/supplies
router.get('/supplies', async (req, res) => {
  try {
    const supplies = await Supply.find().sort({ created_at: -1 });
    res.json(supplies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supply reports' });
  }
});

// GET /api/reports/bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ created_at: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking reports' });
  }
});

export default router;
