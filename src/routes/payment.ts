import { Router } from "express";
import PaymentController from "../controllers/paymentController";

const paymentController = PaymentController();

const router = Router();

router.route("/makePayment").post(paymentController.makePayment);
router.route("/payriff-callback").post(paymentController.callbackPayment);
export default router;
