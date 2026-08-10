import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { CreateUserPayload, LoginUserPayload } from "./auth.interface";
import config from "../../config";
import { AuthProvider, UserStatus } from "../../../generated/prisma/enums";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { jwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";

import type { User as PrismaUser } from "../../../generated/prisma/client";


const registerUser = async (payload: CreateUserPayload) => {
  const { name, email, password, image, role } = payload;

  const isExistsUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isExistsUser) {
    throw new AppError(httpStatus.CONFLICT, "User already exists!");
  }

  const hashPassowrd = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashPassowrd,
      image,
      role,
      provider: AuthProvider.CREDENTIAL,
    },
    omit: { password: true },
  });

  return createdUser;
};

const generateTokens = async (user: PrismaUser) => {
  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const authServices = {
  registerUser,
  generateTokens,
};
