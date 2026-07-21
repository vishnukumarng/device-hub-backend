import { Request, Response, NextFunction } from "express";
import * as deviceService from "../services/device.service";
import { successResponse } from "../utils/response";
import { CreateDeviceRequest } from "../types/device.type";

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
