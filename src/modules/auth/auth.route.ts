import { Router } from "express";
import { authControllers } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import {
  loginValidationSchema,
  registerValidationSchema,
} from "./auth.validation";
import passport from "passport";

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

export const authRoutes = router;
