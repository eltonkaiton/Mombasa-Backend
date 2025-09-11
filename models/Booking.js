import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user_id: String,
  type: String,
  ferry_name: String,
  status: String,
  date: Date,
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Booking', bookingSchema);
