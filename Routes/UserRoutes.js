// server/Routes/UserRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

const router = express.Router();

// ========================
// Middleware: Authenticate JWT
// ========================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ Status: false, Error: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET || "jwt-secret-key", (err, user) => {
    if (err) return res.status(403).json({ Status: false, Error: "Invalid token" });
    req.user = user;
    next();
  });
};

// ========================
// POST /register (User Registration)
// ========================
router.post("/register", async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ Status: false, Error: "Full name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ Status: false, Error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      full_name,
      email,
      password: hashedPassword,
      phone,
      status: "pending",
      role: "passenger",
    });

    await newUser.save();
    res.json({ Status: true, Message: "User registered successfully. Please wait for approval." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ Status: false, Error: "Server error during registration" });
  }
});

// ========================
// POST /login (User + Staff)
// ========================
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ Status: false, Error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ Status: false, Error: "Invalid credentials" });

    if (role && user.role !== role) {
      return res.status(403).json({ Status: false, Error: `Unauthorized: Not a ${role}` });
    }

    if (user.status !== "active") {
      return res.status(403).json({ Status: false, Error: "Your account is not active" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "jwt-secret-key",
      { expiresIn: "1d" }
    );

    res.json({ Status: true, Message: "Login successful", token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ Status: false, Error: "Server error during login" });
  }
});

// ========================
// POST /supplier-login
// ========================
router.post("/supplier-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const supplier = await User.findOne({ email, role: "supplier" });

    if (!supplier) return res.status(404).json({ Status: false, Error: "Supplier not found" });

    const validPassword = await bcrypt.compare(password, supplier.password);
    if (!validPassword) return res.status(401).json({ Status: false, Error: "Invalid credentials" });

    const token = jwt.sign(
      { id: supplier._id, role: "supplier" },
      process.env.JWT_SECRET || "jwt-secret-key",
      { expiresIn: "1d" }
    );

    res.json({ Status: true, Message: "Supplier login successful", token });
  } catch (err) {
    console.error("Supplier login error:", err);
    res.status(500).json({ Status: false, Error: "Server error during supplier login" });
  }
});

// ========================
// GET /dashboard (User Stats + Recent Bookings)
// ========================
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const bookingCount = await Booking.countDocuments();

    const recentBookings = await Booking.find().sort({ created_at: -1 }).limit(5);

    res.json({
      Status: true,
      Data: { users: userCount, bookings: bookingCount, recentBookings },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ Status: false, Error: "Error fetching dashboard data" });
  }
});

// ========================
// GET /me (Current User)
// ========================
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v -created_at");
    if (!user) return res.status(404).json({ Status: false, Error: "User not found" });

    res.json({ Status: true, User: user });
  } catch (err) {
    console.error("Fetch me error:", err);
    res.status(500).json({ Status: false, Error: "Error fetching user details" });
  }
});

// ========================
// POST /add_user (Admin Create User)
// ========================
router.post("/add_user", async (req, res) => {
  try {
    const { full_name, email, password, phone, status, role } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ Status: false, Error: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      full_name,
      email,
      password: hashedPassword,
      phone,
      status: status || "pending",
      role: role || "user",
    });

    await newUser.save();
    res.json({ Status: true, Message: "User added successfully" });
  } catch (err) {
    console.error("Add user error:", err);
    res.status(500).json({ Status: false, Error: "Server error while adding user" });
  }
});

// ========================
// GET /?status=pending (Filter Users by Status)
// ========================
router.get("/", async (req, res) => {
  const { status } = req.query;

  try {
    const filter = status ? { status } : {};
    const users = await User.find(filter).select("_id full_name email phone status created_at");
    res.json({ Status: true, Users: users });
  } catch (err) {
    console.error("Query users error:", err);
    res.status(500).json({ Status: false, Error: "Database error while fetching users" });
  }
});

// ========================
// PUT /:id/status (Update User Status)
// ========================
router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const allowedStatuses = ["pending", "active", "rejected", "suspended"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ Status: false, Error: "Invalid status value" });
  }

  try {
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) return res.status(404).json({ Status: false, Error: "User not found" });

    res.json({ Status: true, Message: `User status updated to ${status}` });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ Status: false, Error: "Database error while updating status" });
  }
});

export { router as UserRouter };
