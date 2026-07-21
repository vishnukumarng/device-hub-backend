import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route";
import productRoutes from "./routes/product.route";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/auth", authRoutes);
app.use("/product", productRoutes);

// base Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Device Hub API is running ",
  });
});

export default app;
