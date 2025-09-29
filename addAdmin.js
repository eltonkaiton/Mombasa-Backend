import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Admin from "./models/Admin.js"; // Adjust the path if needed

dotenv.config();

// 1️⃣ Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Atlas connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

// 2️⃣ Add admin
const addAdmin = async () => {
  try {
    await connectDB();

    const email = "adminmombasa@gmail.com";
    const password = "admin123"; // plaintext password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      email,
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("✅ Admin added to MongoDB Atlas");
    process.exit();
  } catch (err) {
    console.error("❌ Error adding admin:", err);
    process.exit(1);
  }
};

addAdmin();
