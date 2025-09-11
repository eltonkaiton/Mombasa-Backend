import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import connectDB from '../utilis/db.js'; // Adjust path to your DB connection

dotenv.config();

const createAdmin = async () => {
  await connectDB();
  const email = 'admin@gmail.com';
  const plainPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  try {
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log('⚠️ Admin already exists');
      return;
    }

    const admin = new Admin({ name: 'Super Admin', email, password: hashedPassword });
    await admin.save();
    console.log('✅ Admin created successfully');
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();
