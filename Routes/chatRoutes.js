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

    // Validate that userId is a valid ObjectId
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
      userName: "Operation Staff",
      userEmail: "operations@mombasaferry.com",
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

// 🧑‍💼 Staff sends a message to customer - FIXED FOR ObjectId
router.post("/send-staff-message", async (req, res) => {
  try {
    const { userEmail, userName, staffMessage: message } = req.body;

    if (!message || !userEmail) {
      return res.status(400).json({ success: false, message: "Message and userEmail are required." });
    }

    console.log("Sending staff message to:", userEmail);

    // First, find the customer's original message to get their userId (ObjectId)
    const customerMessage = await ChatMessage.findOne({
      userEmail: userEmail,
      sender: "user"
    }).sort({ timestamp: -1 }); // Get the latest customer message

    if (!customerMessage) {
      return res.status(404).json({ 
        success: false, 
        message: "No customer message found for this email. Please ask the customer to send a message first." 
      });
    }

    console.log("Found customer message with userId:", customerMessage.userId);

    // Save staff's message using the customer's ObjectId
    const staffMessage = await ChatMessage.create({
      userId: customerMessage.userId, // Use the customer's ObjectId
      userName: "Operation Staff",
      userEmail: "operations@mombasaferry.com",
      staffCategory: "operation",
      message,
      sender: "staff",
      timestamp: new Date(),
    });

    console.log("Staff message saved successfully");

    res.status(201).json({
      success: true,
      message: "Staff message sent successfully.",
      data: staffMessage,
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

// 💬 Get conversation history between a customer and staff - FIXED FOR ObjectId
router.get("/conversation/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    
    console.log("Fetching conversation for:", userEmail);
    
    // First, find a customer message to get their userId
    const customerMessage = await ChatMessage.findOne({
      userEmail: userEmail,
      sender: "user"
    });

    if (!customerMessage) {
      console.log("No customer messages found for:", userEmail);
      return res.status(200).json({ 
        success: true, 
        messages: [] 
      });
    }

    console.log("Found customer with userId:", customerMessage.userId);

    // Find all messages that belong to this conversation (both customer and staff)
    const conversation = await ChatMessage.find({
      userId: customerMessage.userId // Use the ObjectId to find all related messages
    })
    .populate("userId", "name email") // Populate user details if needed
    .sort({ timestamp: 1 }); // Oldest first for conversation flow

    console.log(`Found ${conversation.length} messages in conversation`);

    res.status(200).json({ 
      success: true, 
      messages: conversation 
    });
  } catch (error) {
    console.error("❌ Error fetching conversation:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch conversation",
      error: error.message 
    });
  }
});

// 🧑‍💼 Get ALL customer messages (for staff dashboard) - FIXED FOR ObjectId
router.get("/staff-messages", async (req, res) => {
  try {
    // Get unique customer conversations using aggregation
    const customerMessages = await ChatMessage.aggregate([
      { 
        $match: { 
          sender: "user" // Only customer messages
        } 
      },
      {
        $sort: { timestamp: -1 } // Sort by latest first
      },
      {
        $group: {
          _id: "$userEmail", // Group by customer email
          latestMessage: { $first: "$$ROOT" }, // Get the latest message
          totalMessages: { $sum: 1 } // Count total messages
        }
      },
      {
        $project: {
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
      {
        $sort: { timestamp: -1 }
      }
    ]);

    // Check which conversations have staff responses
    const messagesWithResponseStatus = await Promise.all(
      customerMessages.map(async (message) => {
        // Check if there are any staff responses to this customer
        const staffResponse = await ChatMessage.findOne({
          sender: "staff",
          userId: message.userId, // Use ObjectId to match
          timestamp: { $gt: message.timestamp }
        });
        
        return {
          ...message,
          responded: !!staffResponse
        };
      })
    );

    res.status(200).json({ 
      success: true, 
      messages: messagesWithResponseStatus 
    });
  } catch (error) {
    console.error("❌ Error fetching staff messages:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch staff messages",
      error: error.message 
    });
  }
});

// 🔍 Get conversation by userId (alternative endpoint)
router.get("/conversation-by-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format." });
    }

    const conversation = await ChatMessage.find({
      userId: new mongoose.Types.ObjectId(userId)
    })
    .populate("userId", "name email")
    .sort({ timestamp: 1 });

    res.status(200).json({ 
      success: true, 
      messages: conversation 
    });
  } catch (error) {
    console.error("❌ Error fetching conversation by user ID:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch conversation",
      error: error.message 
    });
  }
});

// 💬 Get all messages for a specific passenger (by userId) - ADD THIS ENDPOINT
router.get("/messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log("📡 Fetching messages for userId:", userId);
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid user ID format." 
      });
    }

    // Convert to ObjectId
    const objectId = new mongoose.Types.ObjectId(userId);
    
    // Find all messages for this user
    const messages = await ChatMessage.find({ 
      userId: objectId 
    })
    .sort({ timestamp: 1 }) // Oldest first for conversation flow
    .lean(); // Convert to plain JavaScript objects

    console.log(`✅ Found ${messages.length} messages for user ${userId}`);

    res.status(200).json({ 
      success: true, 
      messages 
    });
  } catch (error) {
    console.error("❌ Error fetching messages by userId:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch messages",
      error: error.message 
    });
  }
});

export default router;