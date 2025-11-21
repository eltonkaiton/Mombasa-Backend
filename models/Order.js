import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplier_name: { type: String, required: true },
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  item_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  amount: { type: Number },

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  finance_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  delivery_status: { type: String, enum: ['pending', 'delivered', 'received'], default: 'pending' },

  // 🔥 PAYMENT CONFIRMATION FIELD
  payment_confirmation: {
    type: String,
    enum: ['pending', 'received'],
    default: 'pending'
  },

  delivered_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Order', orderSchema);
