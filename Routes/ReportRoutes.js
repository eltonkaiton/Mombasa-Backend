import express from 'express';
import User from '../models/User.js';      // Mongoose User model
import Booking from '../models/Booking.js'; // Mongoose Booking model

const router = express.Router();

router.get('/daily', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    // Query users with status 'pending' created today
    const pendingUsers = await User.countDocuments({
      status: 'pending',
      created_at: { $gte: todayStart, $lt: tomorrowStart },
    });

    // Query users with status 'active' created today
    const activeUsers = await User.countDocuments({
      status: 'active',
      created_at: { $gte: todayStart, $lt: tomorrowStart },
    });

    // Query bookings with status 'pending' and travel_date today
    const pendingBookings = await Booking.countDocuments({
      booking_status: 'pending',
      travel_date: { $gte: todayStart, $lt: tomorrowStart },
    });

    // Query bookings with status 'approved' and travel_date today
    const approvedBookings = await Booking.countDocuments({
      booking_status: 'approved',
      travel_date: { $gte: todayStart, $lt: tomorrowStart },
    });

    res.json({
      date: todayStart.toISOString().slice(0, 10),
      pendingUsers,
      activeUsers,
      pendingBookings,
      approvedBookings,
    });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const reportRouter = router;
