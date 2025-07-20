import { Router } from "express";
import OrderController from "../controllers/orderController";
import { adminAuthMiddleware } from "../middlewares/adminAuth";
import { validationWrapper } from "../utils/helpers";
import { acceptOrRejectOrderValidation } from "../validations/orderValidation";

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
  .route("/calculateDistanceFee")
  .post(orderController.calculateDistanceFee);

// Order actions for user
router
  .route("/:id")
  .get(orderController.getOrder)
  .patch(
    acceptOrRejectOrderValidation,
    validationWrapper(orderController.acceptOrRejectOrder),
  );

router.route("/:id/start").post(orderController.startOrder);
router.route("/:id/complete").post(orderController.completeOrder);
router.route("/:id/assign").post(orderController.assignEmployeeToOrder);
//
// 🛡️ Admin-Protected Routes for ONLY 3 APIs
//
const adminRouter = Router();

adminRouter.use(adminAuthMiddleware);

// adminRouter.get("/orders", orderController.getOrders);
// adminRouter.get("/orders/:id", orderController.getOrder);
// adminRouter.patch(
//   "/orders/:id",
//   acceptOrRejectOrderValidation,
//   validationWrapper(orderController.acceptOrRejectOrder)
// );

// Mount adminRouter on /admin/orders
router.use("/admin", adminRouter);

export default router;
