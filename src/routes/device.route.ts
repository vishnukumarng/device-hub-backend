import { Router } from "express";
import * as deviceController from "../controller/device.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/create", verifyToken, deviceController.create);

router.get("/get-device", deviceController.getdevice);

router.get("/get-device-detail/:id", deviceController.getdeviceId);

router.get("/get-all-device", deviceController.getalldevice);

export default router;
