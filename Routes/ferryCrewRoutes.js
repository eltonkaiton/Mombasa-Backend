// routes/ferryCrewRoutes.js
import express from "express";
import Booking from "../models/Booking.js";
import Staff from "../models/Staff.js";
import { authenticateFerryCrewToken } from "../middleware/auth.js"; // Ferry crew JWT middleware

const router = express.Router();

/**
 * GET /api/ferrycrew/bookings
 * Fetch all bookings for ferry crew
 */
router.get("/bookings", authenticateFerryCrewToken, async (req, res) => {
  try {
    // ✅ Only allow staff with category "operating" to access
    const staff = await Staff.findById(req.user.id);
    if (!staff || staff.category !== "operating") {
      return res.status(403).json({ message: "Access denied. Crew only." });
    }

    // ✅ Fetch all bookings (no payment_status filter)
    const bookings = await Booking.find({})
      .populate("user_id", "full_name phone email")
      .sort({ created_at: -1 });

    res.json({ bookings });
  } catch (err) {
    console.error("fetch crew bookings error:", err);
    res.status(500).json({ message: "Server error fetching bookings." });
  }
});

/**
 * PUT /api/ferrycrew/bookings/:id/approve
 * Approve a booking
 */
router.put("/bookings/:id/approve", authenticateFerryCrewToken, async (req, res) => {
  try {
    const staff = await Staff.findById(req.user.id);
    if (!staff || staff.category !== "operating") {
      return res.status(403).json({ message: "Access denied. Crew only." });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { booking_status: "approved" },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.json({ message: "Booking approved", booking });
  } catch (err) {
    console.error("approve booking error:", err);
    res.status(500).json({ message: "Server error approving booking." });
  }
});

/**
 * PUT /api/ferrycrew/bookings/:id/assign
 * Assign a ferry to a booking
 */
router.put("/bookings/:id/assign", authenticateFerryCrewToken, async (req, res) => {
  try {
    const staff = await Staff.findById(req.user.id);
    if (!staff || staff.category !== "operating") {
      return res.status(403).json({ message: "Access denied. Crew only." });
    }

    const { ferry_name } = req.body;
    if (!ferry_name) return res.status(400).json({ message: "Ferry name is required." });

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { ferry_name },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.json({ message: `Ferry "${ferry_name}" assigned`, booking });
  } catch (err) {
    console.error("assign ferry error:", err);
    res.status(500).json({ message: "Server error assigning ferry." });
  }
});

export default router;
