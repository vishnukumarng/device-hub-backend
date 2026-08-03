import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

import * as userRepository from "../repositories/auth.repositories";

export const signup = async (name: string, email: string, password: string) => {
  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.createUser({
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
};

export const login = async (email: string, password: string) => {
  const existingUser = await userRepository.findByEmail(email);

  if (!existingUser) {
    throw new Error("Invalid Credentials");
  }

  const isValidPassword = await bcrypt.compare(password, existingUser.password);

  if (!isValidPassword) {
    throw new Error("Invalid Credentials");
  }

  const token = jwt.sign(
    {
      email: existingUser.email,
      id: existingUser.id,
      role: existingUser.role,
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
};

export const userdetail = async (email: string) => {
  const existingUser = await userRepository.findByEmail(email);

  if (!existingUser) {
    throw new Error("Email not found");
  }

  return {
    name: existingUser.name,
    email: existingUser.email,
    createdAt: existingUser.createdAt,
  };
};
