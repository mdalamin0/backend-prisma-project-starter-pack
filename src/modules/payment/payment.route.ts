import { Router } from "express";
import { paymentControllers } from "./payment.controller";

const router = Router();

router.post("/create-payment", paymentControllers.createPyament)
router.get("/bkash-payment/callback", paymentControllers.bkashPyamentCallback)

export const paymentRoutes = router;