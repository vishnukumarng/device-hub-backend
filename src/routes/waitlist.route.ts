import { Router } from "express";
import * as waitlistController from "../controller/waitlist.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/join", verifyToken, waitlistController.join);
router.put("/cancel/:id", verifyToken, waitlistController.leave);
router.get("/me", verifyToken, waitlistController.getMine);

export default router;
