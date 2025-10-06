import { Router } from "express";
import OrderController from "../controllers/orderController";
import { validationWrapper } from "../utils/helpers";
import {
  acceptOrRejectOrderValidation,
  cancelOrderValidation,
} from "../validations/orderValidation";

const orderController = OrderController();
const router = Router();

// Create order (normal user only)
router
  .route("/")
  .post(orderController.createOrder)
  .get(orderController.getOrders);

// My orders (user)
router.route("/my").get(orderController.getMyOrders);

// Request orders
router.route("/createRequestOrder").post(orderController.createRequestOrder);
router.route("/getRequestOrder").get(orderController.getRequestOrder);
router
  .route("/calculateDistanceFee/:id")
  .post(orderController.calculateDistanceFee);

// Order actions for user
router
  .route("/:id")
  .get(orderController.getOrder)
  .patch(
    acceptOrRejectOrderValidation,
    validationWrapper(orderController.acceptOrRejectOrder),
  );

router
  .route("/:id/cancel")
  .post(cancelOrderValidation, validationWrapper(orderController.cancelOrder));
router.route("/:id/start").post(orderController.startOrder);
router.route("/:id/complete").post(orderController.completeOrder);
router.route("/:id/assign").post(orderController.assignEmployeeToOrder);

export default router;
