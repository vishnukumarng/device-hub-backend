import { Router } from "express";
import * as deviceController from "../controller/device.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/create", verifyToken, deviceController.create);

export default router;
