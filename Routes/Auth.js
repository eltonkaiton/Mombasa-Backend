import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const router = express.Router();

// ==========================
// POST /register
// ==========================
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      full_name,
      email,
      phone,
      password: hashedPassword,
      status: 'pending',
      role: 'user',
    });

    await newUser.save();

    res.status(201).json({ message: 'Registration successful, pending approval.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// POST /login
// ==========================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account not active. Please wait for approval.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'jwt_secret_key',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
