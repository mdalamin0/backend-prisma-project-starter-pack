import { Response } from "express";

const sendResponse = <T>(
  res: Response,
  { message, data, error }: { message: string; data?: T; error?: boolean },
  status = 200,
) => {
  res.status(status).json({
    success: !error,
    message,
    data: error ? undefined : data,
  });
};

export default sendResponse;
