import mongoose from 'mongoose';

const supplySchema = new mongoose.Schema({
  item_name: String,
  quantity: Number,
  supplier_name: String,
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Supply', supplySchema);
