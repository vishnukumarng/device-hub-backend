import { Request, Response } from "express";
import * as productService from "../services/product.service";
import { successResponse, errorResponse } from "../utils/response";
import { CreateProductRequest } from "../types/product.type";

export const create = async (req: Request, res: Response) => {
  try {
    const { name, category, serial_no } = req.body;

    const data: CreateProductRequest = {
      name,
      category,
      serial_no,
    };

    const product = await productService.addproduct(data);

    return successResponse(res, 201, "Product added Successfully", product);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error);
  }
};
