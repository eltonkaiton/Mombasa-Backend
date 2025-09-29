import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const router = express.Router();

// DB config
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "mombasa_ferry",
};
let pool;
(async () => {
  pool = await mysql.createPool(dbConfig);
})();

// Register route
router.post("/register", async (req, res) => {
  const { full_name, email, phone, password } = req.body;

  if (!full_name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Full name, email, and password are required." });
  }

  try {
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `INSERT INTO users (full_name, email, phone, password, status, role)
                 VALUES (?, ?, ?, ?, 'pending', 'user')`;
    await pool.query(sql, [full_name, email, phone || null, hashedPassword]);

    res
      .status(201)
      .json({ message: "User registered successfully. Please wait for approval." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ✅ Correct ES module export
export default router;
