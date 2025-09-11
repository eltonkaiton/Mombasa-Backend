import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Staff from '../models/Staff.js';

const router = express.Router();

// ========================
// POST /staff_login
// ========================
router.post('/staff_login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Staff.findOne({ email });
    if (!user) {
      return res.status(401).json({ loginStatus: false, Error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ loginStatus: false, Error: "Invalid credentials" });
    }

    const token = jwt.sign({ role: "staff", email: user.email }, "jwt_secret_key", {
      expiresIn: "1d"
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: false, // set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ loginStatus: true, id: user._id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ loginStatus: false, Error: "Server error during login" });
  }
});

// ========================
// GET /detail/:id
// ========================
router.get('/detail/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select('-password'); // exclude password
    if (!staff) {
      return res.status(404).json({ Status: false, Error: "Staff not found" });
    }
    res.json(staff);
  } catch (err) {
    console.error('Detail fetch error:', err);
    res.status(500).json({ Status: false, Error: "Error fetching staff detail" });
  }
});

// ========================
// GET /logout
// ========================
router.get('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: false, // set to true in production with HTTPS
  });
  res.json({ status: true, message: 'Logged out successfully' });
});


// ========================
// DELETE /delete_staff/:id
// ========================
router.delete('/delete_staff/:id', async (req, res) => {
  try {
    const deleted = await Staff.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ Status: false, Error: 'Staff not found' });
    }

    res.json({ Status: true, message: 'Staff deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ Status: false, Error: 'Server error while deleting staff' });
  }
});




export { router as StaffRouter };
