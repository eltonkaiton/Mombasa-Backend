import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./utilis/db.js"; // MongoDB connection function

// Import routers
import { adminRouter } from "./Routes/AdminRoutes.js";
import { UserRouter } from "./Routes/UserRoutes.js";
import { StaffRouter } from "./Routes/StaffRoutes.js";
import { bookingRouter } from "./Routes/BookingRoutes.js";
import { reportRouter } from "./Routes/ReportRoutes.js";
import authRoutes from "./Routes/Auth.js";
import ordersRouter from "./Routes/OrdersRoutes.js"; // ✅ Orders router

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173"], // Adjust based on your frontend port
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.static("Public"));

// Routes
app.use("/admin", adminRouter);
app.use("/", UserRouter);
app.use("/staff", StaffRouter);
app.use("/bookings", bookingRouter);
app.use("/api/reports", reportRouter);
app.use("/api/auth", authRoutes);

// ✅ Orders API
app.use("/api/orders", ordersRouter);

// Start the server after DB connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("❌ Failed to start server due to MongoDB connection error", err);
});
