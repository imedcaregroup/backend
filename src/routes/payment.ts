import { Router } from "express";
import PaymentController from "../controllers/paymentController";
import {authMiddleware} from "../middlewares/auth";

const paymentController = PaymentController();

const router = Router();

router.route("/payriff-callback").post(paymentController.callbackPayment);

router.use(authMiddleware);
router.route("/makePayment").post(paymentController.makePayment);

export default router;
