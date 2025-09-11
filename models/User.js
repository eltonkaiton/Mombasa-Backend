import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'rejected'],
    default: 'pending',
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'staff'],
    default: 'user',
  },
  created_at: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
export default User;
