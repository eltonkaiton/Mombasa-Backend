// index.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./utilis/db.js";

import { adminRouter } from "./Routes/AdminRoutes.js";
import { UserRouter } from "./Routes/UserRoutes.js";
import { StaffRouter } from "./Routes/StaffRoutes.js";
import { bookingRouter } from "./Routes/BookingRoutes.js";
import { reportRouter } from "./Routes/ReportRoutes.js";
import authRoutes from "./Routes/Auth.js";
import ordersRouter from "./Routes/OrdersRoutes.js";
import ferryRoutes from "./Routes/ferryRoutes.js";
import ferryCrewRoutes from "./Routes/ferryCrewRoutes.js";
import financeRoutes from "./Routes/financeRoutes.js";
import inventoryRoutes from "./Routes/inventoryRoutes.js";
import inventoryChatRoutes from "./Routes/inventoryChatRoutes.js";
import staffBookingRoutes from "./Routes/staffBookingRoutes.js";
import supplierRoutes from "./Routes/supplierRoutes.js";
import createInventoryUser from "./Routes/createInventoryUser.js";
import registerRoute from "./Routes/register.js";
import reportsRoute from "./Routes/reports.js";
import chatRoutes from "./Routes/chatRoutes.js";
import serviceRouter from "./Routes/ServiceRoutes.js";

const app = express();
const PORT = 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("⚠️ CORS blocked origin:", origin);
        callback(null, true); // ✅ allow mobile apps (no origin header)
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.static("Public"));

// Mount routes
app.use("/admin", adminRouter);
app.use("/users", UserRouter);
app.use("/staff", StaffRouter);
app.use("/bookings", bookingRouter);
app.use("/api/reports", reportRouter);
app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRouter);
app.use("/ferries", ferryRoutes);
app.use("/ferry-crew", ferryCrewRoutes);
app.use("/finance", financeRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/inventory-chat", inventoryChatRoutes);
app.use("/staff-bookings", staffBookingRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/inventory-user", createInventoryUser);
app.use("/register", registerRoute);
app.use("/extra-reports", reportsRoute);
app.use("/api/chat", chatRoutes);
app.use("/service", serviceRouter);

// Start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
