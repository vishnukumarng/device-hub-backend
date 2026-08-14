import { Router } from "express";
import * as checkoutController from "../controller/checkout.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/book", verifyToken, checkoutController.checkout);
router.put("/return/:id", verifyToken, checkoutController.returnDevice);
router.get("/me", verifyToken, checkoutController.getMyCheckouts);
router.post("/reserve", verifyToken, checkoutController.reserve);
router.put("/cancel/:id", verifyToken, checkoutController.cancelReservation);
router.post("/claim/:id", verifyToken, checkoutController.claimReservation);

export default router;
