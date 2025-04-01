import { Router } from "express";
import AdminController from "../controllers/adminController";
import { adminAuthMiddleware, superAdminOnly } from "../middlewares/adminAuth";
import { validationWrapper } from "../utils/helpers";
import {
  createAdminValidation,
  loginAdminValidation,
  updateAdminValidation,
  changePasswordValidation,
} from "../validations/adminValidation";
import OrderController from "../controllers/orderController";
import { acceptOrRejectOrderValidation } from "../validations/orderValidation";

const adminController = AdminController();
const orderController = OrderController();
const router = Router();

// Public routes
router
  .route("/login")
  .post(loginAdminValidation, validationWrapper(adminController.loginAdmin));

// Admin authenticated routes
router.use(adminAuthMiddleware);

// ✅ These should be available to both ADMIN and SUPER_ADMIN
router.route("/me").get(adminController.getProfile);
router
  .route("/profile")
  .patch(
    updateAdminValidation,
    validationWrapper(adminController.updateProfile),
  );
router
  .route("/password")
  .patch(
    changePasswordValidation,
    validationWrapper(adminController.changePassword),
  );

// Admin & Super Admin order access
router.get("/orders", orderController.getOrders);
router.route("/getRequestOrder").get(orderController.getRequestOrder);
router.get("/orders/:id", orderController.getOrder);
router.patch(
  "/orders/:id",
  acceptOrRejectOrderValidation,
  validationWrapper(orderController.acceptOrRejeectOrder),
);

// Admin medicals
router.route("/medicals").get(adminController.getAllMedicals);

// ✅ Super admin-only routes after this point
router.use(superAdminOnly);

router
  .route("/")
  .post(
    createAdminValidation,
    validationWrapper(adminController.createAdminWithMedical),
  )
  .get(adminController.getAllAdmins);
router.route("/role").patch(adminController.updateAdminRole);
router.route("/:adminId").delete(adminController.deleteAdmin);

export default router;
