import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/auth", authRoutes);

// Test Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Device Hub API is running ",
  });
});

export default app;
