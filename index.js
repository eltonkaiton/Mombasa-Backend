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

// ================== ✅ CORS Setup (Allow Only Your Frontend + Localhost) ==================
const allowedOrigins = [
  "http://localhost:5173",                // local dev
  "https://mombasa-frontend.onrender.com" // deployed frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Incoming request from origin:", origin); // 🔹 log origin
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // allow cookies / tokens
  })
);

// Middleware
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
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server due to MongoDB connection error", err);
  });
