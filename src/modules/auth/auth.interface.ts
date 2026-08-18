import { Role } from "../../../generated/prisma/enums";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  // image?: string;
  role?: Role
}
export interface IVerifyEmailPayload {
  email: string;
  otp: string
}
export interface LoginUserPayload {
  email: string;
  password: string;
}

export interface ProfileUpdatePayload {
  name?: string;
}

export interface IForgotPasswordPayload {
  email: string;
}
export interface IResetPasswordPayload {
  email: string;
  newPassword: string;
  otp: string;
}
