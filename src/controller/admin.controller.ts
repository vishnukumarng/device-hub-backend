import { Request, Response, NextFunction } from "express";
import * as adminService from "../services/admin.service";
import { successResponse } from "../utils/response";
import { BadRequestError } from "../utils/AppError";

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await adminService.getDashboardStats();
    return successResponse(res, 200, "Dashboard stats fetched successfully", data);
  } catch (error) {
    next(error);
  }
};

export const getAllDevices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const devices = await adminService.getAllDevicesForAdmin();
    return successResponse(res, 200, "Devices fetched successfully", devices);
  } catch (error) {
    next(error);
  }
};

export const createDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, category, serial_no, image_url, status } = req.body;
    if (!name || !category || !serial_no) {
      throw new BadRequestError("Name, category, and serial number are required");
    }

    const device = await adminService.createDeviceByAdmin({
      name,
      category,
      serial_no,
      image_url,
      status,
    });

    return successResponse(res, 201, "Device created successfully", device);
  } catch (error) {
    next(error);
  }
};

export const updateDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      throw new BadRequestError("Device ID is required");
    }

    const updated = await adminService.updateDeviceByAdmin(id, req.body);
    return successResponse(res, 200, "Device updated successfully", updated);
  } catch (error) {
    next(error);
  }
};

export const deleteDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      throw new BadRequestError("Device ID is required");
    }

    await adminService.deleteDeviceByAdmin(id);
    return successResponse(res, 200, "Device deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getAllCheckouts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const checkouts = await adminService.getAllCheckoutsForAdmin();
    return successResponse(res, 200, "Checkouts fetched successfully", checkouts);
  } catch (error) {
    next(error);
  }
};

export const forceReturn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      throw new BadRequestError("Checkout ID is required");
    }

    const result = await adminService.forceReturnCheckout(id);
    return successResponse(res, 200, "Device force-returned successfully", result);
  } catch (error) {
    next(error);
  }
};

export const getAllWaitlists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const waitlists = await adminService.getAllWaitlistsForAdmin();
    return successResponse(res, 200, "Waitlists fetched successfully", waitlists);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await adminService.getAllUsersForAdmin();
    return successResponse(res, 200, "Users fetched successfully", users);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    if (!id || !role) {
      throw new BadRequestError("User ID and role are required");
    }

    const updated = await adminService.updateUserRole(id, role);
    return successResponse(res, 200, "User role updated successfully", updated);
  } catch (error) {
    next(error);
  }
};

