import { prisma } from "../config/prisma";
import { ProductEntity } from "../types/product.type";

export const findBySerialNumber = async (serial_no: string) => {
  return prisma.product.findUnique({
    where: {
      serial_no,
    },
  });
};

export const findByQrCode = async (qr_code: string) => {
  return prisma.product.findUnique({
    where: {
      qr_code,
    },
  });
};

export const createProduct = async (data: ProductEntity) => {
  return prisma.product.create({
    data,
  });
};
