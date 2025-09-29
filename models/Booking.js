// server/models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  booking_type: {
    type: String,
    enum: ['passenger', 'vehicle', 'cargo'],
    required: true
  },

  travel_date: {
    type: Date,
    required: true
  },

  travel_time: {
    type: String,
    required: true
  },

  route: {
    type: String,
    required: true
  },

  // Optional fields based on booking_type
  num_passengers: {
    type: Number,
    min: 1
  },

  vehicle_type: {
    type: String,
    trim: true
  },

  vehicle_plate: {
    type: String,
    trim: true
  },

  cargo_description: {
    type: String,
    trim: true
  },

  cargo_weight_kg: {
    type: Number,
    min: 0
  },

  // Payment info
  amount_paid: {
    type: Number,
    default: 0,
    min: 0
  },

  payment_method: {
    type: String,
    enum: ['mpesa', 'card', 'cash', 'bank'],
    default: 'mpesa'
  },

  transaction_id: {
    type: String,
    trim: true
  },

  // Status fields
  payment_status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },

  booking_status: {
    type: String,
    enum: ['pending', 'approved', 'assigned', 'cancelled', 'completed'],
    default: 'pending'
  },

  ferry_name: {
    type: String,
    trim: true,
    default: null
  },

  // ✅ New field for passenger ferry rating
  ferry_rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },

  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Booking', bookingSchema);
