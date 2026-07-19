import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import { UserRepository } from "../repositories/auth.repositories";

export class UserService {
  private userRepository = new UserRepository();

  async signup(name: string, email: string, password: string) {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.createUser({
      name,
      email,
      password: hashedPassword,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async login(email: string, password: string) {
    const existingUser = await this.userRepository.findByEmail(email);

    if (!existingUser) {
      throw new Error("Invalid Credentials");
    }

    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.password,
    );

    if (!isValidPassword) {
      throw new Error("Invalid Credentials");
    }

    const token = jwt.sign(
      {
        email: existingUser.email,
      },
      process.env.SECRET_KEY as string,
      {
        expiresIn: "7d",
      },
    );

    return {
      name: existingUser.name,
      token,
    };
  }

  async userdetail(email: string) {
    const existingUser = await this.userRepository.findByEmail(email);

    if (!existingUser) {
      throw new Error("Email Not found");
    }

    return {
      name: existingUser.name,
      email: existingUser.email,
      createdAt: existingUser.createdAt,
    };
  }
}
