import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  password: String,
  status: { type: String, default: 'active' },
});

export default mongoose.model('Supplier', supplierSchema);
