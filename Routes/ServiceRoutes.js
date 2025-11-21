import express from 'express';
import Ferry from '../models/Ferry.js';
import Booking from '../models/Booking.js';
import ChatMessage from '../models/ChatMessage.js'; // ✅ THIS WAS MISSING
import { authenticateToken } from '../middleware/authMiddleware.js';

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
      stats: { totalFerries, activeFerries, inactiveFerries, totalBookings },
    });
  } catch (error) {
    console.error('Error fetching service summary:', error);
    res.status(500).json({ message: 'Failed to fetch service summary' });
  }
});

// ======================
// PUT Update Booking Status
// ======================
router.put('/booking/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_status } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.booking_status = booking_status;
    await booking.save();

    res.status(200).json({ success: true, message: `Booking marked as ${booking_status}`, booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
});

// ======================
// PUT Update Ferry Status
// ======================
router.put('/ferry/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ferry = await Ferry.findById(id);
    if (!ferry) return res.status(404).json({ success: false, message: 'Ferry not found' });

    ferry.status = status;
    await ferry.save();

    res.status(200).json({ success: true, message: `Ferry status updated to ${status}`, ferry });
  } catch (error) {
    console.error('Error updating ferry status:', error);
    res.status(500).json({ success: false, message: 'Failed to update ferry status' });
  }
});

// ======================
// GET unread messages count
// ======================
router.get('/messages/unread-count', authenticateToken, async (req, res) => {
  try {
    const unreadCount = await ChatMessage.countDocuments({
      sender: "user",
      staffCategory: "service",
      read: false,
    });

    res.status(200).json({ success: true, unreadCount });
  } catch (err) {
    console.error('Error fetching unread messages count:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch unread messages count' });
  }
});

// ======================
// GET all service messages
// ======================
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ staffCategory: "service" })
      .sort({ timestamp: -1 })
      .lean();

    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error('Error fetching service messages:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// ======================
// POST send staff reply
// ======================
router.post('/messages/send', authenticateToken, async (req, res) => {
  try {
    const { userId, userEmail, staffMessage } = req.body;
    if (!userId || !staffMessage) return res.status(400).json({ success: false, message: 'Missing data' });

    const newMessage = new ChatMessage({
      userId,
      userEmail,
      userName: req.user.name, // Staff name from token
      staffCategory: "service",
      sender: "staff",
      message: staffMessage,
      read: false,
    });

    await newMessage.save();
    res.status(200).json({ success: true, message: 'Message sent' });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

export default router;
