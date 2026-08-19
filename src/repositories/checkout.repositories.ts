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
        status: CheckoutStatus.RETURNED,
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
    select: {
      id: true,
      status: true,
      startTime: true,
      expectedReturnTime: true,
      returnedAt: true,
      type: true,
      device: {
        select: {
          id: true,
          name: true,
          category: true,
          serial_no: true,
          image_url: true,
          status: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
  });
};

export const createReservation = async (
  deviceId: string,
  userId: string,
  startTime: Date,
  expectedReturnTime: Date,
) => {
  const updateResult = await prisma.device.updateMany({
    where: {
      id: deviceId,
      status: DeviceStatus.AVAILABLE,
    },
    data: {
      status: DeviceStatus.RESERVED,
    },
  });

  if (updateResult.count === 0) {
    return null;
  }

  try {
    const checkout = await prisma.checkout.create({
      data: {
        deviceId,
        userId,
        type: CheckoutType.RESERVATION,
        status: CheckoutStatus.ACTIVE,
        startTime,
        expectedReturnTime,
      },
    });
    return checkout;
  } catch (error) {
    await revertDeviceStatus(deviceId);
    throw error;
  }
};

export const cancelReservation = async (
  checkoutId: string,
  deviceId: string,
) => {
  return prisma.$transaction([
    prisma.checkout.update({
      where: { id: checkoutId },
      data: { status: CheckoutStatus.CANCELLED },
    }),
    prisma.device.update({
      where: { id: deviceId },
      data: { status: DeviceStatus.AVAILABLE },
    }),
  ]);
};

export const claimReservation = async (
  checkoutId: string,
  deviceId: string,
  userId: string,
  expectedReturnTime: Date,
) => {
  return prisma.$transaction([
    prisma.checkout.update({
      where: { id: checkoutId },
      data: {
        status: CheckoutStatus.RETURNED,
        returnedAt: new Date(),
      },
    }),
    prisma.checkout.create({
      data: {
        deviceId,
        userId,
        type: CheckoutType.CHECKOUT,
        status: CheckoutStatus.ACTIVE,
        startTime: new Date(),
        expectedReturnTime,
      },
    }),
    prisma.device.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.IN_USE,
      },
    }),
  ]);
};

export const findById = async (id: string) => {
  return prisma.checkout.findMany({
    where: {
      userId: id,
      status: "RETURNED",
    },
    select: {
      status: true,
      returnedAt: true,
      device: {
        select: {
          name: true,
          category: true,
        },
      },
    },
  });
};
