import { prisma } from "../config/prisma";
import { DeviceEntity } from "../types/device.type";

export const findById = async (id: string) => {
  return prisma.device.findUnique({
    where: { id },
  });
};

export const findBySerialNumber = async (serial_no: string) => {
  return prisma.device.findUnique({
    where: {
      serial_no,
    },
  });
};

export const findByQrCode = async (qr_code: string) => {
  return prisma.device.findUnique({
    where: {
      qr_code,
    },
  });
};

export const createDevice = async (data: DeviceEntity) => {
  return prisma.device.create({
    data,
  });
};
