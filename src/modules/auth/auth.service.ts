import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { CreateUserPayload, LoginUserPayload, ProfileUpdatePayload } from "./auth.interface";
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

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    omit: {
      password: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

const updateMe = async(payload:ProfileUpdatePayload, userId: string) => {
   const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
   })

   if(!user){
    throw new AppError(httpStatus.NOT_FOUND, "User not found!")
   }

   const updatedUser = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      name: payload.name,
      image: payload.image
    },
    omit: {password: true}
   })

   return updatedUser
}


export const authServices = {
  registerUser,
  generateTokens,
  getMe,
  updateMe
};
