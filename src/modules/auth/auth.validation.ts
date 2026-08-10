import z, { email } from "zod";

export const registerValidationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginValidationSchema = z.object({
  email: z.email("Invalid email address"),
});
