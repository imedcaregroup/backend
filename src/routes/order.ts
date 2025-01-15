import { Router } from "express";
import OrderController from "../controllers/orderController";
import {
  createOrderValidation,
  acceptOrRejectOrderValidation,
} from "../validations/orderValidation";
import { validationWrapper } from "../utils/helpers";

const orderController = OrderController();

const router = Router();

router
  .route("/")
  .post(validationWrapper(orderController.createOrder))
  .get(orderController.getOrders);
router.route("/my").get(orderController.getMyOrders);
router.route("/createRequestOrder").post(orderController.createRequestOrder);
router.route("/getRequestOrder").get(orderController.getRequestOrder);

router
  .route("/:id")
  .patch(
    acceptOrRejectOrderValidation,
    validationWrapper(orderController.acceptOrRejeectOrder)
  )
  .get(orderController.getOrder);

export default router;
