import config from "../../config";
import AppError from "../../errors/AppError";
import { getBkashIdToken } from "../../lib/bkash";
import httpStatus from "http-status";

const createPyament = async () => {
  const bkashIdToken = await getBkashIdToken();

  if (!bkashIdToken) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Failed to get bKash access token.",
    );
  }

  const bkashCreatePaymentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: bkashIdToken,
        "x-app-key": config.bkash_app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: "01723888888",
        callbackURL: `${config.bkash_callback_url}/payment/bkash-payment/callback`,
        amount: "500",
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: "Inv03",
      }),
    },
  );

  if (!bkashCreatePaymentResponse.ok) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Failed to create bKash payment.",
    );
  }

  const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

  return bkashCreatePaymentResult;
};

const bkashPyamentCallback = async (query: Record<string, any>) => {
  const bkashIdToken = await getBkashIdToken();

  if (!bkashIdToken) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Failed to get bKash access token.",
    );
  }

  const paymentId = query.paymentID;
  if (!paymentId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment ID is missing.");
  }

  const status = query.status;

  if (!status) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment status is missing.");
  }

  const executePayamentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: bkashIdToken,
        "x-app-key": config.bkash_app_key,
      },
      body: JSON.stringify({
        paymentID: paymentId,
      }),
    },
  );

  if (!executePayamentResponse.ok) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Failed to execute bKash payment.",
    );
  }

  const executedPaymentResult = await executePayamentResponse.json();

  if (status === "success") {
    return {
      executedPaymentResult,
      redirectUrl: `${config.frontend_url}/dashboard/my-payments?status=success`,
    };
  }

  if (status === "failure") {
    return {
      executedPaymentResult,
      redirectUrl: `${config.frontend_url}/dashboard/my-payments?status=failure`,
    };
  }

  if (status === "cancel") {
    return {
      executedPaymentResult,
      redirectUrl: `${config.frontend_url}/dashboard/my-payments?status=cancel`,
    };
  }

  return {
    executedPaymentResult,
    redirectUrl: `${config.frontend_url}/dashboard/my-payments`,
  };
};

export const paymentServices = {
  createPyament,
  bkashPyamentCallback,
};
