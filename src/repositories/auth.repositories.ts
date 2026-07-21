import { prisma } from "../config/prisma";
import { SignupDto } from "../types/auth.type";

export const findByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const createUser = async (data: SignupDto) => {
  return prisma.user.create({
    data,
  });
};
