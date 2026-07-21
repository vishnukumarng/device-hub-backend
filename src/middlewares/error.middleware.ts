import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { errorResponse } from "../utils/response";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom AppErrors
  if (err instanceof AppError) {
    return errorResponse(res, err.statusCode, err.message);
  }

  // Handle Prisma unique constraint violation code (P2002)
  if (err.code === "P2002") {
    return errorResponse(
      res,
      409,
      "Conflict: A record with this unique identifier already exists",
      err.meta,
    );
  }

  // Fallback for any other unexpected errors
  console.error("Unhandled Error Details:", err);
  return errorResponse(
    res,
    500,
    "Internal Server Error",
    err.message || String(err),
  );
};
