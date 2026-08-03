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

  return result[0];
};

export const getMyCheckouts = async (email: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return checkoutRepository.findMyActiveCheckouts(user.id);
};
