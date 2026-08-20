import express, { Application, Request, Response, urlencoded } from "express";
import cors from "cors";
import config from "./config";
import cookieParser from "cookie-parser";
import { notFound } from "./middlewares/notFound";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import { authRoutes } from "./modules/auth/auth.route";
import "./config/passport";
import { userRoutes } from "./modules/user/user.route";
import { paymentRoutes } from "./modules/payment/payment.route";

const app: Application = express();

app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  urlencoded({
    extended: true,
  }),
);
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "b7a6 server is running successfully!",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes)

app.use(notFound);
app.use(globalErrorHandler);

export default app;
