import { Router } from "express";
import { authControllers } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import {
  ForgotPasswordZodSchema,
  loginValidationSchema,
  profileUpdateSchema,
  registerValidationSchema,
  ResetPasswordZodSchema,
  userVerifyEmailZodSchema,
} from "./auth.validation";
import passport from "passport";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/register",
  validateRequest(registerValidationSchema),
  authControllers.registerUser,
);

router.post(
  "/verify-email",
  validateRequest(userVerifyEmailZodSchema),
  authControllers.verifyEmail,
);

router.post(
  "/login",
  validateRequest(loginValidationSchema),
  authControllers.loginUser,
);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  authControllers.googleCallback,
);

router.get("/me", auth(Role.ADMIN, Role.USER), authControllers.getMe);

router.patch(
  "/me",
  auth(Role.ADMIN, Role.USER),
  validateRequest(profileUpdateSchema),
  authControllers.updateMe,
);

router.post("/logout", authControllers.logout);

router.post(
  "/forgot-password",
  validateRequest(ForgotPasswordZodSchema),
  authControllers.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest(ResetPasswordZodSchema),
  authControllers.resetPassword,
);


export const authRoutes = router;
