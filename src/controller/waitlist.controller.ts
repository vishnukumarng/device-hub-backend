import { Request, Response, NextFunction } from "express";
import * as waitlistService from "../services/waitlist.service";
import { successResponse } from "../utils/response";
import { JoinWaitlistRequest } from "../types/waitlist.type";

export const join = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.body;
    const userId = (req as any).user.id;

    const data: JoinWaitlistRequest = { deviceId };
    const entry = await waitlistService.joinWaitlist(data, userId);

    return successResponse(res, 201, "Added to waitlist", entry);
  } catch (error) {
    next(error);
  }
};

export const leave = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const entry = await waitlistService.leaveWaitlist(id as string);

    return successResponse(res, 200, "Removed from waitlist", entry);
  } catch (error) {
    next(error);
  }
};

export const getMine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const entries = await waitlistService.getMyWaitlist(userId);

    return successResponse(res, 200, "Waitlist fetched", entries);
  } catch (error) {
    next(error);
  }
};
