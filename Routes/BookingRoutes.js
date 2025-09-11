import express from 'express';
import Booking from '../models/Booking.js';

export const bookingRouter = express.Router();

// ========================
// GET all bookings
// ========================
bookingRouter.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user_id', 'full_name email');
    res.json({ Status: true, Result: bookings });
  } catch (err) {
    console.error(err);
    res.json({ Status: false, Error: 'Error fetching bookings.' });
  }
});

// ========================
// GET booking by ID
// ========================
bookingRouter.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user_id', 'full_name email');
    if (!booking) {
      return res.json({ Status: false, Error: 'Booking not found.' });
    }
    res.json({ Status: true, Result: booking });
  } catch (err) {
    console.error(err);
    res.json({ Status: false, Error: 'Error fetching booking details.' });
  }
});

// ========================
// PUT update booking status
// ========================
bookingRouter.put('/:id', async (req, res) => {
  const { booking_status } = req.body;

  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { booking_status },
      { new: true }
    );

    if (!updated) {
      return res.json({ Status: false, Error: 'Booking not found or not updated.' });
    }

    res.json({ Status: true, Message: 'Booking updated successfully.', Result: updated });
  } catch (err) {
    console.error(err);
    res.json({ Status: false, Error: 'Error updating booking.' });
  }
});
