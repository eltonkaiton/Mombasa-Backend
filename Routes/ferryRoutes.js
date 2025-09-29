import express from 'express';
import Ferry from '../models/Ferry.js';
import Booking from '../models/Booking.js';
import { authenticateStaffToken } from '../middleware/auth.js';

const router = express.Router();

// =======================
// Get all ferries (Staff)
// =======================
router.get('/', authenticateStaffToken, async (req, res) => {
  try {
    const ferries = await Ferry.find().sort({ name: 1 });
    res.json({ ferries });
  } catch (err) {
    console.error('Fetch ferries error:', err);
    res.status(500).json({ message: 'Server error fetching ferries' });
  }
});

// =======================
// Add new ferry
// =======================
router.post('/', authenticateStaffToken, async (req, res) => {
  try {
    const { name, capacity } = req.body;
    if (!name || !capacity)
      return res.status(400).json({ message: 'Name and capacity are required' });

    const existing = await Ferry.findOne({ name });
    if (existing)
      return res.status(400).json({ message: 'Ferry with this name already exists' });

    const ferry = new Ferry({ name, capacity });
    await ferry.save();

    res.json({ message: 'Ferry added successfully', ferry });
  } catch (err) {
    console.error('Add ferry error:', err);
    res.status(500).json({ message: 'Server error adding ferry' });
  }
});

// =======================
// Update ferry
// =======================
router.put('/:id', authenticateStaffToken, async (req, res) => {
  try {
    const { name, capacity } = req.body;
    const ferry = await Ferry.findByIdAndUpdate(
      req.params.id,
      { name, capacity },
      { new: true }
    );
    if (!ferry) return res.status(404).json({ message: 'Ferry not found' });
    res.json({ message: 'Ferry updated successfully', ferry });
  } catch (err) {
    console.error('Update ferry error:', err);
    res.status(500).json({ message: 'Server error updating ferry' });
  }
});

// =======================
// Delete ferry
// =======================
router.delete('/:id', authenticateStaffToken, async (req, res) => {
  try {
    const ferry = await Ferry.findByIdAndDelete(req.params.id);
    if (!ferry) return res.status(404).json({ message: 'Ferry not found' });
    res.json({ message: 'Ferry deleted successfully' });
  } catch (err) {
    console.error('Delete ferry error:', err);
    res.status(500).json({ message: 'Server error deleting ferry' });
  }
});

// =======================
// Assign ferry to a booking
// =======================
router.post('/assign', authenticateStaffToken, async (req, res) => {
  try {
    const { ferryId, bookingId } = req.body;
    if (!ferryId || !bookingId)
      return res.status(400).json({ message: 'Ferry ID and Booking ID are required' });

    const ferry = await Ferry.findById(ferryId);
    if (!ferry) return res.status(404).json({ message: 'Ferry not found' });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.ferry = ferry._id;
    await booking.save();

    res.json({ message: 'Ferry assigned successfully', booking });
  } catch (err) {
    console.error('Assign ferry error:', err);
    res.status(500).json({ message: 'Server error assigning ferry' });
  }
});

export default router;
