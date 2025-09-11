import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

// ========================
// POST /add_user
// ========================
router.post('/add_user', async (req, res) => {
  try {
    const { full_name, email, password, phone, status } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ Status: false, Error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      full_name,
      email,
      password: hashedPassword,
      phone,
      status: status || 'pending'
    });

    await newUser.save();

    res.json({ Status: true, Message: 'User added successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ Status: false, Error: 'Server error' });
  }
});

// ========================
// GET /api/users?status=pending
// ========================
router.get('/api/users', async (req, res) => {
  const { status } = req.query;

  if (!status) {
    return res.status(400).json({ Status: false, Error: 'Status query param is required' });
  }

  try {
    const users = await User.find({ status }).select('id full_name email phone status created_at');
    res.json(users);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ Status: false, Error: 'Database error' });
  }
});

// ========================
// PUT /api/users/:id/status
// ========================
router.put('/api/users/:id/status', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const allowedStatuses = ['pending', 'active', 'rejected', 'suspended'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ Status: false, Error: 'Invalid status value' });
  }

  try {
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });

    if (!user) {
      return res.status(404).json({ Status: false, Error: 'User not found' });
    }

    res.json({ Status: true, Message: `User status updated to ${status}` });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ Status: false, Error: 'Database error' });
  }
});

export { router as UserRouter };
