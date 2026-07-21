import { Router } from "express";
import * as productController from "../controller/product.controller";

const router = Router();

router.post("/create", productController.create);

export default router;
