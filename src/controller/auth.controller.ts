import { Request, Response } from "express";
import * as userService from "../services/auth.service";
import { successResponse, errorResponse } from "../utils/response";

interface AuthRequest extends Request {
  user?: {
    email: string;
  };
}

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const user = await userService.signup(name, email, password);

    return successResponse(res, 201, "User created successfully", user);
  } catch (error: any) {
    return errorResponse(res, 400, error.message);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await userService.login(email, password);

    return successResponse(res, 200, "Login successfully", user);
  } catch (error: any) {
    return errorResponse(res, 400, error.message);
  }
};

export const userdetail = async (req: AuthRequest, res: Response) => {
  try {
    const email = req.user?.email;

    if (!email) {
      return errorResponse(res, 400, "Unauthorized");
    }

    const user = await userService.userdetail(email);

    return successResponse(res, 200, "User details fetched successfully", user);
  } catch (error: any) {
    return errorResponse(res, 400, error.message);
  }
};
