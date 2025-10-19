import express from 'express';
import Ferry from '../models/Ferry.js';
import Booking from '../models/Booking.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // ✅ Import the middleware

const router = express.Router();

// ======================
// GET Service Summary
// ======================
router.get('/summary', async (req, res) => {
  try {
    const ferries = await Ferry.find().lean();
    const bookings = await Booking.find().lean();

    const totalFerries = ferries.length;
    const activeFerries = ferries.filter(f => f.status === 'active').length;
    const inactiveFerries = ferries.filter(f => f.status === 'inactive').length;
    const totalBookings = bookings.length;

    res.status(200).json({
      ferries,
      bookings,
      stats: {
        totalFerries,
        activeFerries,
        inactiveFerries,
        totalBookings,
      },
    });
  } catch (error) {
    console.error('Error fetching service summary:', error);
    res.status(500).json({ message: 'Failed to fetch service summary' });
  }
});

// ======================
// PUT Update Booking Status (mark as delivered)
// ======================
router.put('/booking/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_status } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.booking_status = booking_status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking marked as ${booking_status}`,
      booking,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
});

// ======================
// PUT Update Ferry Status (activate/deactivate)
// ======================
router.put('/ferry/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ferry = await Ferry.findById(id);
    if (!ferry) {
      return res.status(404).json({ success: false, message: 'Ferry not found' });
    }

    ferry.status = status;
    await ferry.save();

    res.status(200).json({
      success: true,
      message: `Ferry status updated to ${status}`,
      ferry,
    });
  } catch (error) {
    console.error('Error updating ferry status:', error);
    res.status(500).json({ success: false, message: 'Failed to update ferry status' });
  }
});

export default router;
