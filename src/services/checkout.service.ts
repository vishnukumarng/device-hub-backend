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

export const checkoutDevice = async (
  email: string,
  dto: CreateCheckoutDTO,
) => {
  // 1. Fetch requesting user
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // 2. Fetch device
  const device = await deviceRepository.findById(dto.deviceId);
  if (!device) {
    throw new NotFoundError("Device not found");
  }

  // 3. Pre-check: Device must be AVAILABLE
  if (device.status !== DeviceStatus.AVAILABLE) {
    throw new ConflictError(`Device is currently ${device.status.toLowerCase()}`);
  }

  // 4. Calculate return timeframe (default to 24 hours if not specified)
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

  // 5. Run Compare-and-Swap checkout transaction
  const checkout = await checkoutRepository.createCheckout(
    dto.deviceId,
    user.id,
    CheckoutType.CHECKOUT,
    expectedReturnTime,
  );

  if (!checkout) {
    throw new ConflictError("Device was claimed by another request; please try again");
  }

  return checkout;
};

export const returnDevice = async (email: string, checkoutId: string) => {
  // 1. Fetch requesting user
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // 2. Fetch active checkout record
  const checkout = await checkoutRepository.findActiveCheckoutById(checkoutId);
  if (!checkout) {
    throw new NotFoundError("Active checkout record not found");
  }

  // 3. Verify user ownership of this checkout session
  if (checkout.userId !== user.id) {
    throw new UnauthorizedError("You do not have permission to return this device checkout");
  }

  // 4. Execute the return transaction (flips checkout status to COMPLETED & device to AVAILABLE)
  const result = await checkoutRepository.returnCheckout(
    checkoutId,
    checkout.deviceId,
  );

  return result[0]; // Returns the updated checkout record
};

export const getMyCheckouts = async (email: string) => {
  // 1. Fetch requesting user
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // 2. Retrieve active checkout list
  return checkoutRepository.findMyActiveCheckouts(user.id);
};
