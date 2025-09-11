import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  salary: Number,
  address: String,
  category: String,
});

export default mongoose.model('Staff', staffSchema);
