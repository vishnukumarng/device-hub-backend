import { prisma } from "../config/prisma";
import { WaitlistEntity } from "../types/waitlist.type";

export const findPendingEntry = async (deviceId: string, userId: string) => {
  return prisma.waitlist.findFirst({
    where: { deviceId, userId, status: "PENDING" },
  });
};

export const createWaitlistEntry = async (data: WaitlistEntity) => {
  return prisma.waitlist.create({
    data: { ...data, status: "PENDING" },
  });
};

export const findOldestPendingForDevice = async (deviceId: string) => {
  return prisma.waitlist.findFirst({
    where: { deviceId, status: "PENDING" },
    orderBy: { createdAt: "asc" }, // first come, first notified
  });
};

export const markNotified = async (id: string) => {
  return prisma.waitlist.update({
    where: { id },
    data: { status: "NOTIFIED", notifiedAt: new Date() },
  });
};

export const cancelEntry = async (id: string) => {
  return prisma.waitlist.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
};

export const findMyWaitlist = async (userId: string) => {
  return prisma.waitlist.findMany({
    where: { userId, status: { in: ["PENDING", "NOTIFIED"] } },
    include: { device: true },
    orderBy: { createdAt: "desc" },
  });
};

export const fulfillUserWaitlist = async (deviceId: string, userId: string) => {
  return prisma.waitlist.updateMany({
    where: {
      deviceId,
      userId,
      status: { in: ["PENDING", "NOTIFIED"] },
    },
    data: {
      status: "FULFILLED",
    },
  });
};

