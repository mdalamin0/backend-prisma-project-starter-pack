import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import {
  CreateUserPayload,
  IForgotPasswordPayload,
  IResetPasswordPayload,
  LoginUserPayload,
  ProfileUpdatePayload,
} from "./auth.interface";
import ejs from "ejs";
import config from "../../config";
import { AuthProvider, UserStatus } from "../../../generated/prisma/enums";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { jwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";
import crypto from "crypto";

import type { User as PrismaUser } from "../../../generated/prisma/client";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import path from "path";

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

const updateMe = async (payload: ProfileUpdatePayload, userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name: payload.name,
      image: payload.image,
    },
    omit: { password: true },
  });

  return updatedUser;
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const { email } = payload;
  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User does not exist!");
  }

  if (isUserExist.status === "SUSPENDED") {
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended!");
  }

  if (!isUserExist.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User email is not verified!");
  }

  if (isUserExist.googleId && isUserExist.provider === "GOOGLE") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google account does not have a password!",
    );
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const key = `forgot-password-otp:${isUserExist.email}`;
  const expirationSeconds = 5 * 60;

  await redisClient.set(key, otp, {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  const tempatePath = path.join(
    process.cwd(),
    "src/templates/forgot-password.ejs",
  );

  const tempateData = {
    name: isUserExist.name,
    otp,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(tempatePath, tempateData)

  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExist.email,
    subject: "Forgot Password OTP",
    html,
  });
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, newPassword, otp } = payload;
  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User does not exist!");
  }

  if (isUserExist.status === "SUSPENDED") {
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended!");
  }

  if (!isUserExist.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User email is not verified!");
  }

  if (isUserExist.googleId && isUserExist.provider === "GOOGLE") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google account does not have a password!",
    );
  }
  const key = `forgot-password-otp:${isUserExist.email}`;

  const redisOtp = await redisClient.get(key);

  if (!redisOtp) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired OTP!");
  }

  if (redisOtp !== otp) {
    throw new AppError(httpStatus.UNAUTHORIZED, "OTP does not match!");
  }

  const hashedNewPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: {
      email: isUserExist.email,
    },
    data: {
      password: hashedNewPassword,
    },
  });

  await redisClient.del([key]);

    const tempatePath = path.join(
      process.cwd(),
      "src/templates/reset-password-success.ejs",
    );

    const tempateData = {
      name: isUserExist.name
    };

    const html = await ejs.renderFile(tempatePath, tempateData);

    await transporter.sendMail({
      from: config.email_sender,
      to: isUserExist.email,
      subject: "Password Changed",
      html,
    });
};

export const authServices = {
  registerUser,
  generateTokens,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
};
