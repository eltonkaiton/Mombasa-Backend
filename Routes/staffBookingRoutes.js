// server/routes/staffBookingRoutes.js
import express from 'express';
import Booking from '../models/Booking.js';
import Ferry from '../models/Ferry.js';
import { authenticateStaffToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================
// Get all bookings (for staff dashboard)
// ==========================
router.get('/', authenticateStaffToken, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user_id', 'full_name email phone'); // only populate user
    res.json({ bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
});

// ==========================
// Approve a booking
// ==========================
router.post('/approve/:bookingId', authenticateStaffToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.booking_status = 'approved';
    await booking.save();

    res.json({ message: 'Booking approved', booking });
  } catch (err) {
    console.error('Error approving booking:', err);
    res.status(500).json({ message: 'Server error approving booking' });
  }
});

// ==========================
// Reject a booking
// ==========================
router.post('/reject/:bookingId', authenticateStaffToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.booking_status = 'cancelled'; // using 'cancelled' instead of 'rejected' to match schema enum
    await booking.save();

    res.json({ message: 'Booking rejected', booking });
  } catch (err) {
    console.error('Error rejecting booking:', err);
    res.status(500).json({ message: 'Server error rejecting booking' });
  }
});

// ==========================
// Assign ferry to booking
// ==========================
router.post('/assign-ferry/:bookingId', authenticateStaffToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { ferryId } = req.body;

    if (!ferryId) return res.status(400).json({ message: 'Ferry ID is required' });

    const ferry = await Ferry.findById(ferryId);
    if (!ferry) return res.status(404).json({ message: 'Ferry not found' });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.ferry_name = ferry.name; // store ferry name in booking
    booking.booking_status = 'assigned';
    await booking.save();

    res.json({ message: `Ferry ${ferry.name} assigned successfully`, booking });
  } catch (err) {
    console.error('Assign ferry error:', err);
    res.status(500).json({ message: 'Server error assigning ferry' });
  }
});

export default router;
