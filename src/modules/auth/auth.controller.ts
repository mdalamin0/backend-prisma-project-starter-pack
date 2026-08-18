import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authServices } from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import config from "../../config";
import passport from "passport";
import AppError from "../../errors/AppError";
import type { AuthenticateCallback } from "passport";

const registerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    await authServices.registerUser(payload);

    sendResponse(
      res,
      { message: "Email Verification OTP Send.", data: null },
      httpStatus.OK,
    );
  },
);

const verifyEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const { accessToken, refreshToken, user } =
      await authServices.verifyEmail(payload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: config.node_env === "production",
      sameSite: config.node_env === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.node_env === "production",
      sameSite: config.node_env === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    sendResponse(
      res,
      {
        message: "Email verified and user created successfully!",
        data: {
          accessToken,
          refreshToken,
          user,
        },
      },
      httpStatus.CREATED,
    );
  },
);

const loginUser = (req: Request, res: Response, next: NextFunction) => {
  const callback: AuthenticateCallback = async (err, user, info) => {
    try {
      if (err) {
        return next(err);
      }

      if (!user) {
        const message =
          typeof info === "object" &&
          info !== null &&
          "message" in info &&
          typeof info.message === "string"
            ? info.message
            : "Invalid email or password";

        return next(new AppError(httpStatus.UNAUTHORIZED, message));
      }

      const { accessToken, refreshToken } =
        await authServices.generateTokens(user);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: config.node_env === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 24,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: config.node_env === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      return sendResponse(res, {
        message: "User logged in successfully!",
        data: { accessToken, refreshToken },
      });
    } catch (error) {
      next(error);
    }
  };

  passport.authenticate("local", callback)(req, res, next);
};

const googleCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    const { accessToken, refreshToken } = await authServices.generateTokens(
      user!,
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: config.node_env === "production",
      sameSite: config.node_env === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.node_env === "production",
      sameSite: config.node_env === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.redirect(`${config.frontend_url}/auth/success`);
  },
);

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const result = await authServices.getMe(userId as string);

    sendResponse(res, {
      message: "User data retrive successfully.",
      data: result,
    });
  },
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: config.node_env === "production",
      sameSite: config.node_env === "production" ? "none" : "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: config.node_env === "production",
      sameSite: config.node_env === "production" ? "none" : "lax",
    });

    sendResponse(
      res,
      {
        message: "User logged out successfully!",
      },
      httpStatus.OK,
    );
  },
);

const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const userId = req.user?.id;
    const result = await authServices.updateMe(payload, userId!);

    sendResponse(res, {
      message: "User update successfully.",
      data: result,
    });
  },
);

const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    await authServices.forgotPassword(payload);

    sendResponse(res, {
      message: `OTP Sent To your Email : ${payload.email}`,
      data: null,
    });
  },
);

const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    await authServices.resetPassword(payload);

    sendResponse(res, {
      message: `Password changed successfully!`,
      data: null,
    });
  },
);

export const authControllers = {
  registerUser,
  verifyEmail,
  loginUser,
  googleCallback,
  updateMe,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
};
