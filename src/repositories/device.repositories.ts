import { prisma } from "../config/prisma";
import { DeviceEntity } from "../types/device.type";

export const findById = async (id: string) => {
  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      checkouts: {
        where: { status: "ACTIVE" },
        select: {
          expectedReturnTime: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!device) return null;

  const activeCheckout = device.checkouts[0] ?? null;

  return {
    id: device.id,
    name: device.name,
    status: device.status,
    category: device.category,
    imageUrl: device.image_url,
    serialNumber: device.serial_no,
    ...(device.status === "IN_USE" && activeCheckout
      ? {
          expectedReturnDate: activeCheckout.expectedReturnTime,
          checkedOutBy: activeCheckout.user.name,
        }
      : {}),
  };
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

export const findAlldevice = async () => {
  return prisma.device.findMany();
};
