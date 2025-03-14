import { Router } from "express";
import FcmTokenController from "../controllers/fcmTokenController";
import { setFcmTokenValidation } from "../validations/fcmTokenValidation";
import { validationWrapper } from "../utils/helpers";

const fcmTokenController = FcmTokenController();

const router = Router();

router
  .route("/")
  .post(
    setFcmTokenValidation,
    validationWrapper(fcmTokenController.setFcmToken)
  )
  .patch(
    setFcmTokenValidation,
    validationWrapper(fcmTokenController.deleteFcmToken)
  );

export default router;
