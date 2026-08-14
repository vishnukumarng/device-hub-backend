import { CheckoutType, DeviceStatus } from "@prisma/client";
import * as userRepository from "../repositories/auth.repositories";
import * as deviceRepository from "../repositories/device.repositories";
import * as checkoutRepository from "../repositories/checkout.repositories";
import { CreateCheckoutDTO } from "../types/checkout.type";
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  BadRequestError,
} from "../utils/AppError";
import { notifyNextInLine, fulfillWaitlist } from "./waitlist.service";

export const checkoutDevice = async (email: string, dto: CreateCheckoutDTO) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const device = await deviceRepository.findById(dto.deviceId);
  if (!device) {
    throw new NotFoundError("Device not found");
  }

  if (device.status !== DeviceStatus.AVAILABLE) {
    throw new ConflictError(
      `Device is currently ${device.status.toLowerCase()}`,
    );
  }

  let expectedReturnTime: Date;
  if (dto.expectedReturnTime) {
    expectedReturnTime = new Date(dto.expectedReturnTime);
    if (isNaN(expectedReturnTime.getTime())) {
      throw new BadRequestError("Invalid expectedReturnTime date format");
    }
  } else {
    expectedReturnTime = new Date();
    expectedReturnTime.setHours(expectedReturnTime.getHours() + 24);
  }

  const checkout = await checkoutRepository.createCheckout(
    dto.deviceId,
    user.id,
    CheckoutType.CHECKOUT,
    expectedReturnTime,
  );

  if (!checkout) {
    throw new ConflictError(
      "Device was claimed by another request; please try again",
    );
  }

  // Fulfill any waitlist entry for this user and device
  try {
    await fulfillWaitlist(dto.deviceId, user.id);
  } catch (error) {
    console.error("Failed to fulfill user waitlist entry upon checkout:", error);
  }

  return checkout;
};

export const returnDevice = async (email: string, checkoutId: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const checkout = await checkoutRepository.findActiveCheckoutById(checkoutId);
  if (!checkout) {
    throw new NotFoundError("Active checkout record not found");
  }

  if (checkout.userId !== user.id) {
    throw new UnauthorizedError(
      "You do not have permission to return this device checkout",
    );
  }

  const result = await checkoutRepository.returnCheckout(
    checkoutId,
    checkout.deviceId,
  );

  // Notify next user in line on waitlist
  try {
    await notifyNextInLine(checkout.deviceId);
  } catch (error) {
    console.error("Failed to notify next user in line on waitlist:", error);
  }

  return result[0];
};

export const getMyCheckouts = async (email: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return checkoutRepository.findMyActiveCheckouts(user.id);
};

export const reserveDevice = async (
  email: string,
  deviceId: string,
  startTimeStr: string,
  expectedReturnTimeStr?: string,
) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const device = await deviceRepository.findById(deviceId);
  if (!device) {
    throw new NotFoundError("Device not found");
  }

  if (device.status !== DeviceStatus.AVAILABLE) {
    throw new ConflictError(`Device is currently ${device.status.toLowerCase()}`);
  }

  const startTime = new Date(startTimeStr);
  if (isNaN(startTime.getTime())) {
    throw new BadRequestError("Invalid startTime date format");
  }

  let expectedReturnTime: Date;
  if (expectedReturnTimeStr) {
    expectedReturnTime = new Date(expectedReturnTimeStr);
    if (isNaN(expectedReturnTime.getTime())) {
      throw new BadRequestError("Invalid expectedReturnTime date format");
    }
  } else {
    // Default to 2 hours reservation duration
    expectedReturnTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
  }

  const reservation = await checkoutRepository.createReservation(
    deviceId,
    user.id,
    startTime,
    expectedReturnTime,
  );

  if (!reservation) {
    throw new ConflictError("Device was reserved by another request; please try again");
  }

  return reservation;
};

export const cancelReservation = async (email: string, checkoutId: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const checkout = await checkoutRepository.findActiveCheckoutById(checkoutId);
  if (!checkout) {
    throw new NotFoundError("Active reservation record not found");
  }

  if (checkout.userId !== user.id) {
    throw new UnauthorizedError("You do not have permission to cancel this reservation");
  }

  if (checkout.type !== CheckoutType.RESERVATION) {
    throw new BadRequestError("This record is not a reservation");
  }

  const result = await checkoutRepository.cancelReservation(
    checkoutId,
    checkout.deviceId,
  );

  return result[0];
};

export const claimReservation = async (
  email: string,
  checkoutId: string,
  expectedReturnTimeStr?: string,
) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const checkout = await checkoutRepository.findActiveCheckoutById(checkoutId);
  if (!checkout) {
    throw new NotFoundError("Active reservation record not found");
  }

  if (checkout.userId !== user.id) {
    throw new UnauthorizedError("You do not have permission to claim this reservation");
  }

  if (checkout.type !== CheckoutType.RESERVATION) {
    throw new BadRequestError("This record is not a reservation");
  }

  let expectedReturnTime: Date;
  if (expectedReturnTimeStr) {
    expectedReturnTime = new Date(expectedReturnTimeStr);
    if (isNaN(expectedReturnTime.getTime())) {
      throw new BadRequestError("Invalid expectedReturnTime date format");
    }
  } else {
    // Default to 2 hours checkout duration
    expectedReturnTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  }

  const result = await checkoutRepository.claimReservation(
    checkoutId,
    checkout.deviceId,
    user.id,
    expectedReturnTime,
  );

  return result[1]; // Return the created Checkout record
};

