import { Router } from "express";
import { authControllers } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import {
  loginValidationSchema,
  profileUpdateSchema,
  registerValidationSchema,
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


export const authRoutes = router;
