import express from "express";
import mongoose from "mongoose";
import ChatMessage from "../models/ChatMessage.js";

const router = express.Router();

// 📨 Passenger sends a message
router.post("/send-message", async (req, res) => {
  try {
    const { message, userId, userName, userEmail, staffCategory, timestamp } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ success: false, message: "Message and userId are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format." });
    }

    // Save user's message
    const userMessage = await ChatMessage.create({
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      userEmail,
      staffCategory: staffCategory || "operation",
      message,
      sender: "user",
      timestamp: timestamp || new Date(),
    });

    // Auto staff response
    const staffMessage = await ChatMessage.create({
      userId: new mongoose.Types.ObjectId(userId),
      userName: staffCategory === "finance" ? "Finance Staff" : "Operation Staff",
      userEmail: staffCategory === "finance" ? "finance@mombasaferry.com" : "operations@mombasaferry.com",
      staffCategory: staffCategory || "operation",
      message: `Hello ${userName || "Passenger"}, your message has been received. Our ${staffCategory || "operation"} team will respond shortly.`,
      sender: "staff",
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: { userMessage, staffMessage },
    });
  } catch (error) {
    console.error("❌ Error saving message:", error);
    res.status(500).json({ success: false, message: "Failed to send message to staff" });
  }
});

// 🧑‍💼 Staff sends a message to customer
router.post("/send-staff-message", async (req, res) => {
  try {
    const { userEmail, userName, staffMessage: message, staffCategory } = req.body;

    if (!message || !userEmail) {
      return res.status(400).json({ success: false, message: "Message and userEmail are required." });
    }

    // Find the latest customer message
    const customerMessage = await ChatMessage.findOne({
      userEmail,
      sender: "user"
    }).sort({ timestamp: -1 });

    if (!customerMessage) {
      return res.status(404).json({ 
        success: false, 
        message: "No customer message found for this email. Ask the customer to send a message first." 
      });
    }

    // Save staff's message with the correct category
    const staffMsg = await ChatMessage.create({
      userId: customerMessage.userId,
      userName: staffCategory === "finance" ? "Finance Staff" : "Operation Staff",
      userEmail: staffCategory === "finance" ? "finance@mombasaferry.com" : "operations@mombasaferry.com",
      staffCategory: staffCategory ? staffCategory.toLowerCase() : "operation",
      message,
      sender: "staff",
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Staff message sent successfully.",
      data: staffMsg,
    });
  } catch (error) {
    console.error("❌ Error saving staff message:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send staff message",
      error: error.message 
    });
  }
});

// 💬 Get conversation by userEmail
router.get("/conversation/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;

    const customerMessage = await ChatMessage.findOne({
      userEmail,
      sender: "user"
    });

    if (!customerMessage) return res.status(200).json({ success: true, messages: [] });

    const conversation = await ChatMessage.find({ userId: customerMessage.userId })
      .sort({ timestamp: 1 });

    res.status(200).json({ success: true, messages: conversation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch conversation", error: error.message });
  }
});

// 🧑‍💼 Get all customer messages (for staff dashboard)
router.get("/staff-messages", async (req, res) => {
  try {
    const customerMessages = await ChatMessage.aggregate([
      { $match: { sender: "user" } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$userEmail", latestMessage: { $first: "$$ROOT" }, totalMessages: { $sum: 1 } } },
      { $project: { 
          _id: "$latestMessage._id",
          userId: "$latestMessage.userId",
          userName: "$latestMessage.userName",
          userEmail: "$latestMessage.userEmail",
          message: "$latestMessage.message",
          timestamp: "$latestMessage.timestamp",
          sender: "$latestMessage.sender",
          staffCategory: "$latestMessage.staffCategory",
          totalMessages: 1 
        } 
      },
      { $sort: { timestamp: -1 } }
    ]);

    const messagesWithResponseStatus = await Promise.all(
      customerMessages.map(async (message) => {
        const staffResponse = await ChatMessage.findOne({
          sender: "staff",
          userId: message.userId,
          timestamp: { $gt: message.timestamp }
        });
        return { ...message, responded: !!staffResponse };
      })
    );

    res.status(200).json({ success: true, messages: messagesWithResponseStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch staff messages", error: error.message });
  }
});

// 🔍 Get conversation by userId
router.get("/conversation-by-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const conversation = await ChatMessage.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ timestamp: 1 });

    res.status(200).json({ success: true, messages: conversation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch conversation", error: error.message });
  }
});

// 💬 Get all messages for a specific passenger (by userId)
router.get("/messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const messages = await ChatMessage.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ timestamp: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch messages", error: error.message });
  }
});

// 🔍 Get messages by user + category
router.get("/messages/:userId/:category", async (req, res) => {
  try {
    const { userId, category } = req.params;

    if (!userId || !category) return res.status(400).json({ success: false, message: "User ID and category required" });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const messages = await ChatMessage.find({
      userId: new mongoose.Types.ObjectId(userId),
      staffCategory: category.toLowerCase(),
    }).sort({ timestamp: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error while fetching messages", error: error.message });
  }
});




export default router;
