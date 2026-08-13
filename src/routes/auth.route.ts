import { Router } from "express";
import * as authController from "../controller/auth.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/signup", authController.signup);

router.post("/login", authController.login);

router.get("/me", verifyToken, authController.userdetail);

export default router;
