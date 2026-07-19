import { Router } from "express";
import { UserController } from "../controller/auth.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

const userController = new UserController();

router.post("/signup", userController.signup.bind(userController));
router.post("/login", userController.login.bind(userController));
router.get(
  "/userdetail",
  verifyToken,
  userController.userdetail.bind(userController),
);

export default router;
