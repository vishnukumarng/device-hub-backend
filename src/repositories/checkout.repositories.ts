import { prisma } from "../config/prisma";
import { CheckoutType, DeviceStatus, CheckoutStatus } from "@prisma/client";

export const revertDeviceStatus = async (deviceId: string) => {
  return prisma.device.update({
    where: { id: deviceId },
    data: { status: DeviceStatus.AVAILABLE },
  });
};

export const createCheckout = async (
  deviceId: string,
  userId: string,
  type: CheckoutType,
  expectedReturnTime: Date,
) => {
  // Atomic compare-and-swap: claim the device if status is AVAILABLE
  const updateResult = await prisma.device.updateMany({
    where: {
      id: deviceId,
      status: DeviceStatus.AVAILABLE,
    },
    data: {
      status: DeviceStatus.IN_USE,
    },
  });

  // If count is 0, device was already claimed (or doesn't exist/not available)
  if (updateResult.count === 0) {
    return null;
  }

  // Create Checkout record
  try {
    const startTime = new Date();
    const checkout = await prisma.checkout.create({
      data: {
        deviceId,
        userId,
        type,
        status: CheckoutStatus.ACTIVE,
        startTime,
        expectedReturnTime,
      },
    });
    return checkout;
  } catch (error) {
    // Compensating rollback: if checkout creation fails, revert device status
    await revertDeviceStatus(deviceId);
    throw error;
  }
};

export const returnCheckout = async (checkoutId: string, deviceId: string) => {
  return prisma.$transaction([
    prisma.checkout.update({
      where: { id: checkoutId },
      data: {
        status: CheckoutStatus.COMPLETED,
        returnedAt: new Date(),
      },
    }),
    prisma.device.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.AVAILABLE,
      },
    }),
  ]);
};

export const findActiveCheckoutById = async (checkoutId: string) => {
  return prisma.checkout.findFirst({
    where: {
      id: checkoutId,
      status: CheckoutStatus.ACTIVE,
    },
  });
};

export const findMyActiveCheckouts = async (userId: string) => {
  return prisma.checkout.findMany({
    where: {
      userId,
      status: CheckoutStatus.ACTIVE,
    },
    include: {
      device: true,
    },
  });
};
