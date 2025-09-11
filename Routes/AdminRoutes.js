import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';
import Category from '../models/Category.js';
import Staff from '../models/Staff.js';
import Supplier from '../models/Supplier.js';
import User from '../models/User.js'; // ✅ Import User model

const router = express.Router();

// ======================== Admin Login ========================
router.post('/adminlogin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.json({ loginStatus: false, Error: "Wrong email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.json({ loginStatus: false, Error: "Wrong email or password" });

    const token = jwt.sign({ role: "admin", email }, "jwt_secret_key", { expiresIn: "1d" });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ loginStatus: true, token });
  } catch (err) {
    res.json({ loginStatus: false, Error: "Server Error" });
  }
});

// ======================== Category Routes ========================
router.get('/category', async (req, res) => {
  try {
    const result = await Category.find();
    res.json({ Status: true, Result: result });
  } catch {
    res.json({ Status: false, Error: "Query Error" });
  }
});

router.post('/add_category', async (req, res) => {
  try {
    await Category.create({ category: req.body.category });
    res.json({ Status: true });
  } catch {
    res.json({ Status: false, Error: "Insert Error" });
  }
});

// ======================== Staff Routes ========================
router.post('/add_staff', async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    await Staff.create({ ...req.body, password: hash });
    res.json({ Status: true });
  } catch {
    res.json({ Status: false, Error: "Insert Error" });
  }
});

router.get('/staff', async (req, res) => {
  try {
    const result = await Staff.find();
    res.json({ Status: true, Result: result });
  } catch {
    res.json({ Status: false, Error: "Query Error" });
  }
});

router.get('/staff/:id', async (req, res) => {
  try {
    const result = await Staff.findById(req.params.id);
    if (!result) return res.json({ Status: false, Error: "Staff not found" });
    res.json({ Status: true, Result: result });
  } catch {
    res.json({ Status: false, Error: "Query Error" });
  }
});

router.put('/staff/:id', async (req, res) => {
  try {
    await Staff.findByIdAndUpdate(req.params.id, req.body);
    res.json({ Status: true });
  } catch {
    res.json({ Status: false, Error: "Update Error" });
  }
});

router.delete('/delete_staff/:id', async (req, res) => {
  try {
    await Staff.findByIdAndDelete(req.params.id);
    res.json({ Status: true, Message: "Staff deleted successfully" });
  } catch {
    res.json({ Status: false, Error: "Delete Error" });
  }
});

// ======================== ✅ Add User Route ========================
router.post('/add_user', async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ Status: false, Error: "Missing fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ Status: false, Error: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      full_name,
      email,
      password: hash,
      phone,
      role: 'user',
      status: 'pending',
    });

    res.status(201).json({ Status: true, Result: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ Status: false, Error: "Insert Error" });
  }
});

// ======================== Supplier Routes ========================
router.get('/suppliers', async (req, res) => {
  try {
    const result = await Supplier.find();
    res.json({ Status: true, Result: result });
  } catch {
    res.status(500).json({ Status: false, Error: "Query Error" });
  }
});

router.get('/suppliers/:id', async (req, res) => {
  try {
    const result = await Supplier.findById(req.params.id);
    if (!result) return res.json({ Status: false, Error: "Supplier not found" });
    res.json({ Status: true, Result: result });
  } catch {
    res.status(500).json({ Status: false, Error: "Query Error" });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const { name, email, phone, address, password } = req.body;
    if (!name || !phone || !password)
      return res.status(400).json({ Status: false, Error: "Name, Phone, and Password are required" });

    const hash = await bcrypt.hash(password, 10);
    await Supplier.create({ name, email, phone, address, password: hash, status: 'active' });
    res.json({ Status: true, Message: "Supplier added successfully" });
  } catch {
    res.status(500).json({ Status: false, Error: "Insert Error" });
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    await Supplier.findByIdAndUpdate(req.params.id, req.body);
    res.json({ Status: true, Message: "Supplier updated successfully" });
  } catch {
    res.status(500).json({ Status: false, Error: "Update Error" });
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ Status: true, Message: "Supplier deleted successfully" });
  } catch {
    res.status(500).json({ Status: false, Error: "Delete Error" });
  }
});

export { router as adminRouter };
