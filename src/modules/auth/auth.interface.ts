import { Role } from "../../../generated/prisma/enums";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  image?: string;
  role?: Role
}
export interface LoginUserPayload {
  email: string;
  password: string;
}
