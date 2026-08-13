import { Request, Response, NextFunction } from "express";
import * as deviceService from "../services/device.service";
import { successResponse } from "../utils/response";
import { CreateDeviceRequest } from "../types/device.type";
import { BadRequestError } from "../utils/AppError";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, category, serial_no } = req.body;

    const data: CreateDeviceRequest = {
      name,
      category,
      serial_no,
    };

    const device = await deviceService.addDevice(data);

    return successResponse(res, 201, "Device added successfully", device);
  } catch (error) {
    next(error);
  }
};

export const getdevice = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { qr_code } = req.query;
    if (typeof qr_code !== "string") {
      throw new BadRequestError("QR code must be a string");
    }
    console.log(qr_code);
    const device = await deviceService.getDevice(qr_code);

    return successResponse(res, 200, "Device added successfully", device);
  } catch (error) {
    next(error);
  }
};

export const getalldevice = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const devices = await deviceService.getAllDevice();

    return successResponse(
      res,
      200,
      "Device detail fetched successfully",
      devices,
    );
  } catch (error) {
    next(error);
  }
};

export const getdeviceId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      throw new BadRequestError("Device ID must be a string");
    }

    const device = await deviceService.fetchDevice(id);

    return successResponse(res, 200, "Device added successfully", device);
  } catch (error) {
    next(error);
  }
};
