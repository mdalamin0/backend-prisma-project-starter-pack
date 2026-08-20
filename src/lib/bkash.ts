import config from "../config";
import AppError from "../errors/AppError";
import { redisClient } from "./redis";
import httpStatus from "http-status";

export const getBkashIdToken = async () => {
  try {
    const idTokenKey = "bkash:idToken";
    const refreshTokenKey = "bkash:refreshToken";

    let bkashIdToken = await redisClient.get(idTokenKey);
    const bkashIdTokenTTL = await redisClient.ttl(idTokenKey);

    const bkashRefreshToken = await redisClient.get(refreshTokenKey);
    const bkashRefreshTokenTTL = await redisClient.ttl(refreshTokenKey);

    if (
      (bkashIdTokenTTL <= 600 || !bkashIdToken) &&
      bkashRefreshToken &&
      bkashRefreshTokenTTL > 600
    ) {
      const refreshTokenResponse = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: config.bkash_username,
            password: config.bkash_password,
          },
          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: bkashRefreshToken,
          }),
        },
      );

      if (!refreshTokenResponse.ok) {
        throw new AppError(
          httpStatus.BAD_GATEWAY,
          "Failed to refresh bKash ID token.",
        );
      }

      const refreshTokenResult = await refreshTokenResponse.json();

      if (!refreshTokenResult.id_token) {
        throw new AppError(
          httpStatus.BAD_GATEWAY,
          "Invalid response from bKash refresh API.",
        );
      }

      bkashIdToken = refreshTokenResult.id_token as string;

      await redisClient.set(idTokenKey, bkashIdToken, {
        expiration: {
          type: "EX",
          value: 60 * 60, //1 hour
        },
      });
      return bkashIdToken;
    }

    if (bkashIdTokenTTL > 600) {
      return bkashIdToken;
    }

    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: config.bkash_username,
          password: config.bkash_password,
        },
        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
        }),
      },
    );

    if (!response.ok) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "Failed to get bKash ID token.",
      );
    }

    const result = await response.json();

    if (!result.id_token || !result.refresh_token) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "Invalid response from bKash.",
      );
    }

    // Bkash id token set
    await redisClient.set(idTokenKey, result.id_token, {
      expiration: {
        type: "EX",
        value: 60 * 60, // 1 hour
      },
    });

    // Bkash refresh token set
    await redisClient.set(refreshTokenKey, result.refresh_token, {
      expiration: {
        type: "EX",
        value: 60 * 60 * 24 * 28, // 28 days
      },
    });

    bkashIdToken = result.id_token;
    return bkashIdToken;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Bkash authentication failed.",
    );
  }
};
