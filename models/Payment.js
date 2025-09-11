import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  method: String,
  status: String,
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Payment', paymentSchema);
