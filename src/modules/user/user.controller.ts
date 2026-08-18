import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { userServices } from "./user.service";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";

const uploadProfileImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      throw new AppError(httpStatus.BAD_REQUEST, "No file uploaded");
    }

    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated!");
    }

    const result = await userServices.uploadProfileImage(
      req.file?.buffer,
      userId,
    );

    sendResponse(res, {
      message: "Profile image updated successfully.",
      data: result,
    });
  },
);

export const userControllers = {
  uploadProfileImage,
};
