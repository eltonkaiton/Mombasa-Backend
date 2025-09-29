// routes/StaffRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Staff from '../models/Staff.js';

const router = express.Router();

// ========================
// POST /login
// (Mounted under /staff → /staff/login)
// ========================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Staff.findOne({ email });
    if (!user) {
      return res.status(401).json({ loginStatus: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ loginStatus: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { role: "staff", email: user.email, id: user._id },
      "jwt_secret_key",
      { expiresIn: "1d" }
    );

    // Set cookie (optional)
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: false, // ⚠️ set to true in production (HTTPS)
      maxAge: 24 * 60 * 60 * 1000,
    });

    // ✅ Respond with token + user object
    res.json({
      loginStatus: true,
      token,
      user: {
        _id: user._id,
        full_name: user.name,
        email: user.email,
        role: "staff",
        category: user.category,
        salary: user.salary,
        address: user.address
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ loginStatus: false, message: "Server error during login" });
  }
});

// ========================
// GET /detail/:id
// ========================
router.get('/detail/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select('-password'); // exclude password
    if (!staff) {
      return res.status(404).json({ Status: false, message: "Staff not found" });
    }
    res.json(staff);
  } catch (err) {
    console.error('Detail fetch error:', err);
    res.status(500).json({ Status: false, message: "Error fetching staff detail" });
  }
});

// ========================
// GET /logout
// ========================
router.get('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: false, // ⚠️ set to true in production
  });
  res.json({ status: true, message: 'Logged out successfully' });
});

// ========================
// DELETE /delete/:id
// ========================
router.delete('/delete/:id', async (req, res) => {
  try {
    const deleted = await Staff.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ Status: false, message: 'Staff not found' });
    }

    res.json({ Status: true, message: 'Staff deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ Status: false, message: 'Server error while deleting staff' });
  }
});

export { router as StaffRouter };
