// index.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./utilis/db.js"; // MongoDB connection

// ================== Import Routers ==================
import { adminRouter } from "./Routes/AdminRoutes.js";
import { UserRouter } from "./Routes/UserRoutes.js";
import { StaffRouter } from "./Routes/StaffRoutes.js";
import { bookingRouter } from "./Routes/BookingRoutes.js";
import { reportRouter } from "./Routes/ReportRoutes.js";
import authRoutes from "./Routes/Auth.js";
import ordersRouter from "./Routes/OrdersRoutes.js";

// Extra routes from your file tree
import ferryRoutes from "./Routes/ferryRoutes.js";
import ferryCrewRoutes from "./Routes/ferryCrewRoutes.js";
import financeRoutes from "./Routes/financeRoutes.js";
import inventoryRoutes from "./Routes/inventoryRoutes.js";
import inventoryChatRoutes from "./Routes/inventoryChatRoutes.js";
import staffBookingRoutes from "./Routes/staffBookingRoutes.js";
import supplierRoutes from "./Routes/supplierRoutes.js";
import createInventoryUser from "./Routes/createInventoryUser.js"; 
import registerRoute from "./Routes/register.js"; 
import reportsRoute from "./Routes/reports.js"; // looks like a duplicate of ReportRoutes

// ================== Setup ==================
const app = express();
const PORT = 5000;

// ✅ CORS Setup (only allow frontend + localhost)
const allowedOrigins = [
  "http://localhost:5173",                 // local dev
  "https://mombasa-frontend.onrender.com", // deployed frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Incoming request from origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.static("Public"));

// ================== Mount Routes ==================
app.use("/admin", adminRouter);
app.use("/users", UserRouter);
app.use("/staff", StaffRouter);
app.use("/bookings", bookingRouter);
app.use("/api/reports", reportRouter);
app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRouter);

// Extra mounted routes
app.use("/ferries", ferryRoutes);
app.use("/ferry-crew", ferryCrewRoutes);
app.use("/finance", financeRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/inventory-chat", inventoryChatRoutes);
app.use("/staff-bookings", staffBookingRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/inventory-user", createInventoryUser);
app.use("/register", registerRoute);
app.use("/extra-reports", reportsRoute); // ⚠️ check if this is duplicate

// ================== Start Server ==================
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server due to MongoDB connection error", err);
  });
