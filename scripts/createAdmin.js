import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";
import connectDB from "../utilis/db.js"; // FIXED folder name typo (utils)

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const email = "admin@gmail.com";
    const plainPassword = "admin123";

    // Check if admin already exists
    const existing = await Admin.findOne({ email });

    if (existing) {
      console.log("⚠️ Admin already exists");
      return;
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create admin
    const admin = new Admin({
      name: "Super Admin",
      email,
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();

    console.log("✅ Admin created successfully");
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
};

createAdmin();