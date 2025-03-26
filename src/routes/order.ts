import { Router } from "express";
import OrderController from "../controllers/orderController";
import {
  createOrderValidation,
  acceptOrRejectOrderValidation,
} from "../validations/orderValidation";
import { validationWrapper } from "../utils/helpers";
import { authMiddleware } from "../middlewares/auth";
import { adminAuthMiddleware } from "../middlewares/adminAuth";

const orderController = OrderController();
const router = Router();

//
// 🔐 User-Protected Routes
//
router.use(authMiddleware);

// Create order (normal user only)
router
  .route("/")
  .post(createOrderValidation, validationWrapper(orderController.createOrder))
  .get(orderController.getOrders);

// My orders (user)
router.route("/my").get(orderController.getMyOrders);

// Request orders
router.route("/createRequestOrder").post(orderController.createRequestOrder);
router.route("/getRequestOrder").get(orderController.getRequestOrder);

// Order actions for user
router
  .route("/:id")
  .get(orderController.getOrder)
  .patch(
    acceptOrRejectOrderValidation,
    validationWrapper(orderController.acceptOrRejeectOrder)
  );

//
// 🛡️ Admin-Protected Routes for ONLY 3 APIs
//
const adminRouter = Router();

adminRouter.use(adminAuthMiddleware);

adminRouter.get("/orders", orderController.getOrders);
adminRouter.get("/orders/:id", orderController.getOrder);
adminRouter.patch(
  "/orders/:id",
  acceptOrRejectOrderValidation,
  validationWrapper(orderController.acceptOrRejeectOrder)
);

// Mount adminRouter on /admin/orders
router.use("/admin", adminRouter);

export default router;
