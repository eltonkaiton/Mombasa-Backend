import express from 'express';
import Ferry from '../models/Ferry.js';
import Booking from '../models/Booking.js';
import { authenticateStaffToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * ============================
 * GET ALL FERRIES (STAFF ONLY)
 * ============================
 */
router.get('/', authenticateStaffToken, async (req, res) => {
  try {
    const ferries = await Ferry.find().sort({ name: 1 });
    res.json({ success: true, ferries });
  } catch (error) {
    console.error('❌ Error fetching ferries:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching ferries',
      error: error.message,
    });
  }
});

/**
 * ============================
 * ADD NEW FERRY
 * ============================
 */
router.post('/', authenticateStaffToken, async (req, res) => {
  try {
    const { name, capacity } = req.body;

    if (!name || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Both name and capacity are required',
      });
    }

    const existingFerry = await Ferry.findOne({ name });
    if (existingFerry) {
      return res.status(400).json({
        success: false,
        message: 'A ferry with this name already exists',
      });
    }

    const newFerry = new Ferry({ name, capacity });
    await newFerry.save();

    res.json({
      success: true,
      message: 'Ferry added successfully',
      ferry: newFerry,
    });
  } catch (error) {
    console.error('❌ Error adding ferry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding ferry',
      error: error.message,
    });
  }
});

/**
 * ============================
 * UPDATE FERRY DETAILS
 * ============================
 */
router.put('/:id', authenticateStaffToken, async (req, res) => {
  try {
    const { name, capacity, status } = req.body;

    const updatedFerry = await Ferry.findByIdAndUpdate(
      req.params.id,
      { name, capacity, status },
      { new: true, runValidators: true }
    );

    if (!updatedFerry) {
      return res.status(404).json({
        success: false,
        message: 'Ferry not found',
      });
    }

    res.json({
      success: true,
      message: 'Ferry updated successfully',
      ferry: updatedFerry,
    });
  } catch (error) {
    console.error('❌ Error updating ferry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating ferry',
      error: error.message,
    });
  }
});

/**
 * ============================
 * DELETE FERRY
 * ============================
 */
router.delete('/:id', authenticateStaffToken, async (req, res) => {
  try {
    const deletedFerry = await Ferry.findByIdAndDelete(req.params.id);

    if (!deletedFerry) {
      return res.status(404).json({
        success: false,
        message: 'Ferry not found',
      });
    }

    res.json({
      success: true,
      message: 'Ferry deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting ferry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting ferry',
      error: error.message,
    });
  }
});

/**
 * ============================
 * ASSIGN FERRY TO BOOKING
 * ============================
 */
router.post('/assign', authenticateStaffToken, async (req, res) => {
  try {
    const { ferryId, bookingId } = req.body;

    if (!ferryId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Both ferryId and bookingId are required',
      });
    }

    const ferry = await Ferry.findById(ferryId);
    if (!ferry) {
      return res.status(404).json({
        success: false,
        message: 'Ferry not found',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // ✅ Assign ferry name (since booking schema uses ferry_name)
    booking.ferry_name = ferry.name;
    booking.booking_status = 'assigned';
    await booking.save();

    res.json({
      success: true,
      message: `Ferry '${ferry.name}' assigned successfully to booking`,
      booking,
    });
  } catch (error) {
    console.error('❌ Error assigning ferry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning ferry',
      error: error.message,
    });
  }
});

/**
 * ============================
 * GET FERRY OCCUPANCY DETAILS
 * ============================
 */
router.get('/occupancy', authenticateStaffToken, async (req, res) => {
  try {
    const ferries = await Ferry.find();
    const bookings = await Booking.find({
      booking_status: 'assigned',
      ferry_name: { $ne: null },
    });

    const occupancyData = ferries.map(ferry => {
      const assignedBookings = bookings.filter(b => b.ferry_name === ferry.name);
      const occupied = assignedBookings.length;
      const remaining = Math.max(0, ferry.capacity - occupied);
      return {
        _id: ferry._id,
        name: ferry.name,
        capacity: ferry.capacity,
        occupied,
        remaining,
        status: ferry.status,
      };
    });

    res.json({ success: true, ferries: occupancyData });
  } catch (err) {
    console.error("❌ Occupancy fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching occupancy data",
      error: err.message,
    });
  }
});

export default router;
