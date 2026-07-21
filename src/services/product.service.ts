import crypto from "crypto";
import * as productRepository from "../repositories/product.repositories";
import { CreateProductRequest, ProductEntity } from "../types/product.type";

export const addproduct = async (data: CreateProductRequest) => {
  const existingProduct = await productRepository.findBySerialNumber(
    data.serial_no,
  );

  if (existingProduct) {
    throw new Error("Product is already existed");
  }

  const qr_code = crypto.randomUUID();
  const image_path = "/demo.jpg";

  const productdata: ProductEntity = {
    ...data,
    qr_code,
    image_path,
  };

  const product = await productRepository.createProduct(productdata);

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    serialNo: product.serial_number,
    image: product.image_path,
  };
};
