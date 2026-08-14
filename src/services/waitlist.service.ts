import * as waitlistRepository from "../repositories/waitlist.repositories";
import * as deviceRepository from "../repositories/device.repositories";
import { JoinWaitlistRequest } from "../types/waitlist.type";
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "../utils/AppError";

export const joinWaitlist = async (
  data: JoinWaitlistRequest,
  userId: string,
) => {
  const device = await deviceRepository.findById(data.deviceId);
  if (!device) throw new NotFoundError("Device not found");

  if (device.status === "AVAILABLE") {
    throw new BadRequestError(
      "This device is already available — no need to wait",
    );
  }

  const existing = await waitlistRepository.findPendingEntry(
    data.deviceId,
    userId,
  );
  if (existing) {
    throw new ConflictError("You're already on the waitlist for this device");
  }

  return waitlistRepository.createWaitlistEntry({
    deviceId: data.deviceId,
    userId,
  });
};

export const leaveWaitlist = async (waitlistId: string) => {
  return waitlistRepository.cancelEntry(waitlistId);
};

export const getMyWaitlist = async (userId: string) => {
  return waitlistRepository.findMyWaitlist(userId);
};

export const notifyNextInLine = async (deviceId: string) => {
  const nextEntry =
    await waitlistRepository.findOldestPendingForDevice(deviceId);
  if (!nextEntry) return null;

  await waitlistRepository.markNotified(nextEntry.id);

  return nextEntry;
};

export const fulfillWaitlist = async (deviceId: string, userId: string) => {
  return waitlistRepository.fulfillUserWaitlist(deviceId, userId);
};

