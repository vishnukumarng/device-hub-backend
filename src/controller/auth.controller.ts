import { Request, Response } from "express";
import { UserService } from "../services/auth.service";
import { errorResponse, successResponse } from "../utils/response";

const userService = new UserService();

interface AuthRequest extends Request {
  user?: {
    email: string;
  };
}

export class UserController {
  async signup(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      const user = await userService.signup(name, email, password);

      return successResponse(res, 201, "User created successfully", user);
    } catch (error: any) {
      return errorResponse(res, 400, error.message);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await userService.login(email, password);

      return successResponse(res, 200, "Login successfully", user);
    } catch (error: any) {
      return errorResponse(res, 400, error.message);
    }
  }

  async userdetail(req: AuthRequest, res: Response) {
    try {
      const email = req.user?.email;

      if (!email) {
        throw new Error("Token not found");
      }

      const user = await userService.userdetail(email);

      return successResponse(
        res,
        200,
        "User details fetched successfully",
        user,
      );
    } catch (error: any) {
      return errorResponse(res, 400, error.message);
    }
  }
}
