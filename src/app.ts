import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route";
import deviceRoutes from "./routes/device.route";
import checkoutRoutes from "./routes/checkout.route";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/device", deviceRoutes);
app.use("/checkout", checkoutRoutes);

// Base Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Device Hub API is running",
  });
});

// Centralized error handler (must be registered last)
app.use(errorHandler);

export default app;
