// routes/BookingRoutes.js
import express from 'express';
import Booking from '../models/Booking.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Helper for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================
// Create Booking (Passenger)
// =============================
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const {
      booking_type,
      travel_date,
      travel_time,
      route,
      num_passengers,
      vehicle_type,
      vehicle_plate,
      cargo_description,
      cargo_weight_kg,
      payment_method,
      amount_paid,
      transaction_id,
      ferry_name,
    } = req.body;

    const newBooking = new Booking({
      user_id: req.user.id,
      booking_type,
      travel_date,
      travel_time,
      route,
      num_passengers,
      vehicle_type,
      vehicle_plate,
      cargo_description,
      cargo_weight_kg,
      payment_method,
      amount_paid,
      transaction_id,
      ferry_name: ferry_name || null,
      payment_status: 'pending',
    });

    await newBooking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: newBooking,
    });
  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// =============================
// Get My Bookings (Passenger)
// =============================
router.get('/mybookings', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'passenger') {
      return res.status(403).json({ success: false, message: 'Only passengers can view their bookings' });
    }

    const { page = 1, limit = 10, booking_status } = req.query;
    const filters = { user_id: req.user.id };

    if (booking_status) filters.booking_status = booking_status;

    const bookings = await Booking.find(filters)
      .populate('user_id', 'full_name email')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filters);

    res.json({
      success: true,
      bookings,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Fetch bookings error:', err);
    res.status(500).json({ success: false, message: 'Error fetching bookings' });
  }
});

// =============================
// Get Paid Bookings (Passenger/Crew)
// =============================
router.get('/paid', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    let filters = { payment_status: 'paid' };

    if (req.user.role === 'passenger') {
      filters.user_id = req.user.id;
    }

    const bookings = await Booking.find(filters)
      .populate('user_id', 'full_name email')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filters);

    res.json({
      success: true,
      bookings,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Fetch paid bookings error:', err);
    res.status(500).json({ success: false, message: 'Error fetching paid bookings' });
  }
});

// =============================
// Cancel Booking (Passenger)
// =============================
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'passenger') {
      return res.status(403).json({ success: false, message: 'Only passengers can cancel bookings' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, user_id: req.user.id });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.booking_status = 'cancelled';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ success: false, message: 'Error cancelling booking' });
  }
});

// =============================
// Get Booking Receipt (PDF)
// =============================
router.get('/:id/receipt/pdf', authenticateToken, async (req, res) => {
  try {
    const bookingQuery = { _id: req.params.id };
    if (req.user.role === 'passenger') bookingQuery.user_id = req.user.id;

    const booking = await Booking.findOne(bookingQuery).populate('user_id', 'full_name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (['approved', 'assigned'].includes(booking.booking_status) && booking.payment_status === 'paid') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=receipt-${booking._id}.pdf`);
      doc.pipe(res);

      const logoPath = path.join(__dirname, '../public/mombasafs.jpg');
      try { doc.image(logoPath, 50, 20, { width: 70 }); } catch {}

      doc.fontSize(18).text('Mombasa Ferry Services', 150, 30);
      doc.moveDown();
      doc.fontSize(20).text('Booking Receipt', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Passenger Name: ${booking.user_id.full_name}`);
      doc.text(`Email: ${booking.user_id.email}`);
      doc.text(`Booking ID: ${booking._id}`);
      doc.text(`Type: ${booking.booking_type}`);
      doc.text(`Route: ${booking.route}`);
      doc.text(`Date: ${new Date(booking.travel_date).toDateString()}`);
      doc.text(`Time: ${booking.travel_time}`);
      doc.text(`Passengers: ${booking.num_passengers || 'N/A'}`);
      doc.text(`Vehicle: ${booking.vehicle_type || 'N/A'} (${booking.vehicle_plate || 'N/A'})`);
      doc.text(`Cargo: ${booking.cargo_description || 'N/A'}`);
      doc.text(`Weight: ${booking.cargo_weight_kg || 'N/A'} kg`);
      doc.text(`Amount Paid: KES ${booking.amount_paid}`);
      doc.text(`Payment Method: ${booking.payment_method}`);
      doc.text(`Payment Status: ${booking.payment_status}`);
      doc.text(`Booking Status: ${booking.booking_status}`);
      doc.text(`Ferry: ${booking.ferry_name || 'Not yet assigned'}`);
      doc.text(`Created At: ${booking.created_at.toDateString()}`);

      doc.end();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Receipt available only for approved/assigned and paid bookings',
      });
    }
  } catch (err) {
    console.error('Receipt PDF error:', err);
    res.status(500).json({ success: false, message: 'Error generating receipt PDF' });
  }
});

// =============================
// Rate a Booking (Passenger)
// =============================
router.post('/rate', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'passenger') {
      return res.status(403).json({ success: false, message: 'Only passengers can rate bookings' });
    }

    const { bookingId, rating } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'Booking ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const booking = await Booking.findOne({ _id: bookingId, user_id: req.user.id });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.ferry_rating = rating;
    await booking.save();

    res.json({ success: true, message: 'Rating submitted successfully', booking });
  } catch (err) {
    console.error('Rating error:', err);
    res.status(500).json({ success: false, message: 'Error submitting rating' });
  }
});

// =============================
// Admin/Staff Routes
// =============================

// Get all bookings
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const bookings = await Booking.find().populate('user_id', 'full_name email');
    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching bookings.' });
  }
});

// Get booking by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const booking = await Booking.findById(req.params.id).populate('user_id', 'full_name email');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    res.json({ success: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching booking details.' });
  }
});

// Update booking status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { booking_status } = req.body;
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { booking_status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Booking not found or not updated.' });
    }

    res.json({ success: true, message: 'Booking updated successfully.', booking: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating booking.' });
  }
});

// ✅ Named export to match index.js
export const bookingRouter = router;
