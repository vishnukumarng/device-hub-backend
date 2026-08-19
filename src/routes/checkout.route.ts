import { Router } from "express";
import * as checkoutController from "../controller/checkout.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/book", verifyToken, checkoutController.checkout);
router.put("/return/:id", verifyToken, checkoutController.returnDevice);
router.get("/get-all-list", verifyToken, checkoutController.getMyCheckouts);
router.post("/reserve", verifyToken, checkoutController.reserve);
router.put("/cancel/:id", verifyToken, checkoutController.cancelReservation);
router.post("/claim/:id", verifyToken, checkoutController.claimReservation);
router.get("/get-return-list", verifyToken, checkoutController.getMyReturnList);

export default router;
