import { Router } from "express";
import * as adminController from "../controller/admin.controller";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Protect all admin routes with authentication
router.use(verifyToken);

// Dashboard Overview
router.get("/dashboard", adminController.getDashboardStats);

// Device Inventory Management
router.get("/devices", adminController.getAllDevices);
router.post("/devices", adminController.createDevice);
router.put("/devices/:id", adminController.updateDevice);
router.delete("/devices/:id", adminController.deleteDevice);

// Checkouts & Loans Oversight
router.get("/checkouts", adminController.getAllCheckouts);
router.put("/checkouts/force-return/:id", adminController.forceReturn);

// Waitlists
router.get("/waitlist", adminController.getAllWaitlists);

// Users Management
router.get("/users", adminController.getAllUsers);
router.put("/users/:id/role", adminController.updateUserRole);

export default router;
