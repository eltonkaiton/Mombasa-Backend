// backend/routes/orders.js
import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// ✅ GET all orders safely
router.get('/', async (req, res) => {
  try {
    // Fetch all orders
    const orders = await Order.find();

    // Map orders to include supplier/item names safely
    const safeOrders = orders.map(order => ({
      _id: order._id,
      supplier_id: order.supplier_id || null,
      supplier_name: order.supplier_name || (order.supplier_id ? 'Unknown Supplier' : ''),
      item_id: order.item_id || null,
      item_name: order.item_name || (order.item_id ? 'Unknown Item' : ''),
      quantity: order.quantity,
      amount: order.amount,
      status: order.status,
      finance_status: order.finance_status,
      delivery_status: order.delivery_status,
      delivered_at: order.delivered_at,
      created_at: order.created_at
    }));

    res.status(200).json(safeOrders);

  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order payments' });
  }
});


export default router;
