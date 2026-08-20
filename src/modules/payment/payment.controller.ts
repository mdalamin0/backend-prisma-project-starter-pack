import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { paymentServices } from "./payment.service";
import httpStatus from "http-status";

const createPyament = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await paymentServices.createPyament();

    sendResponse(
      res,
      {
        message: "Payment created successfully.",
        data: result,
      },
      httpStatus.CREATED,
    );
  },
);

const bkashPyamentCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { executedPaymentResult, redirectUrl } =
      await paymentServices.bkashPyamentCallback(req.query);

      console.log(executedPaymentResult);
      res.redirect(redirectUrl)

    // sendResponse(
    //   res,
    //   {
    //     message: "Payment created successfully.",
    //     data: {},
    //   },
    //   httpStatus.CREATED,
    // );
  },
);

export const paymentControllers = {
  createPyament,
  bkashPyamentCallback,
};
