import { Router } from "express";
import * as checkoutController from "../controller/checkout.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/book", verifyToken, checkoutController.checkout);
router.post("/:id/return", verifyToken, checkoutController.returnDevice);
router.get("/me", verifyToken, checkoutController.getMyCheckouts);

export default router;
