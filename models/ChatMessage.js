import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userName: { type: String, required: true },
  userEmail: { type: String },
  staffCategory: { type: String, default: "operation" },
  sender: {
    type: String,
    enum: ["user", "staff", "system"],
    required: true,
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }, // ✅ Track if staff has read the message
});

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
export default ChatMessage;
