import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import config from "../config";
import AppError from "../errors/AppError";
import { ZodError } from "zod";
import multer from "multer";

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);
  let statusCode;
  let errorMessage =
    err instanceof Error ? err.message : "Internal Server Error";
    

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  }

  if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage = err.issues[0]?.message || "Validation failed";
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = "File size must be less than 5MB.";
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage = "You have provided incorrect field type or missing fields";
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      ((statusCode = httpStatus.CONFLICT),
        (errorMessage = "Duplicate Key Error"));
    } else if (err.code === "P2003") {
      ((statusCode = httpStatus.BAD_REQUEST),
        (errorMessage = "Foreign key constraint failed"));
    } else if (err.code === "P2025") {
      ((statusCode = httpStatus.NOT_FOUND),
        (errorMessage =
          "An operation failed because it depends on one or more records that were required but not found."));
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      errorMessage =
        "Authentication failed against database server. Please Check Your Credentials";
    } else if (err.errorCode === "P1001") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = "Can't reach database server";
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    errorMessage = "Error occurred during query execution";
  }

  res.status(statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    statusCode: statusCode || httpStatus.INTERNAL_SERVER_ERROR,
    message: errorMessage,
    error:
      config.node_env === "development" && err instanceof Error
        ? err.stack
        : undefined,
  });
};

export default globalErrorHandler;
