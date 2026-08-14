import { Request, Response, NextFunction } from "express";
import * as checkoutService from "../services/checkout.service";
import { successResponse } from "../utils/response";
import { CreateCheckoutDTO } from "../types/checkout.type";
import { BadRequestError } from "../utils/AppError";

interface AuthRequest extends Request {
  user?: {
    email: string;
  };
}

export const checkout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const email = req.user?.email;
    if (!email) {
      throw new BadRequestError("User authentication details missing");
    }

    const { deviceId, expectedReturnTime } = req.body;
    if (!deviceId) {
      throw new BadRequestError("Device ID is required");
    }

    const dto: CreateCheckoutDTO = {
      deviceId,
      expectedReturnTime,
    };

    await checkoutService.checkoutDevice(email, dto);

    return successResponse(res, 201, "Device checked out successfully");
  } catch (error) {
    next(error);
  }
};

export const returnDevice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const email = req.user?.email;
    if (!email) {
      throw new BadRequestError("User authentication details missing");
    }

    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Checkout ID is required");
    }

    const checkoutData = await checkoutService.returnDevice(
      email,
      id as string,
    );

    return successResponse(
      res,
      200,
      "Device returned successfully",
      checkoutData,
    );
  } catch (error) {
    next(error);
  }
};

export const getMyCheckouts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const email = req.user?.email;
    if (!email) {
      throw new BadRequestError("User authentication details missing");
    }

    const checkouts = await checkoutService.getMyCheckouts(email);

    return successResponse(
      res,
      200,
      "Active checkouts fetched successfully",
      checkouts,
    );
  } catch (error) {
    next(error);
  }
};

export const reserve = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const email = req.user?.email;
    if (!email) {
      throw new BadRequestError("User authentication details missing");
    }

    const { deviceId, startTime, expectedReturnTime } = req.body;
    if (!deviceId) {
      throw new BadRequestError("Device ID is required");
    }
    if (!startTime) {
      throw new BadRequestError("Reservation start time is required");
    }

    const reservation = await checkoutService.reserveDevice(
      email,
      deviceId,
      startTime,
      expectedReturnTime,
    );

    return successResponse(res, 201, "Device reserved successfully", reservation);
  } catch (error) {
    next(error);
  }
};

export const cancelReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const email = req.user?.email;
    if (!email) {
      throw new BadRequestError("User authentication details missing");
    }

    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Reservation ID is required");
    }

    const checkoutData = await checkoutService.cancelReservation(email, id as string);

    return successResponse(res, 200, "Reservation cancelled successfully", checkoutData);
  } catch (error) {
    next(error);
  }
};

export const claimReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const email = req.user?.email;
    if (!email) {
      throw new BadRequestError("User authentication details missing");
    }

    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Reservation ID is required");
    }

    const { expectedReturnTime } = req.body;

    const checkoutData = await checkoutService.claimReservation(
      email,
      id as string,
      expectedReturnTime,
    );

    return successResponse(res, 200, "Reservation checked out successfully", checkoutData);
  } catch (error) {
    next(error);
  }
};

