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

const adminController = AdminController();
const router = Router();

// Public routes (no authentication required)
router
  .route("/login")
  .post(loginAdminValidation, validationWrapper(adminController.loginAdmin));

// Admin authenticated routes
router.use(adminAuthMiddleware);

// Profile routes (available to all authenticated admins)
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
    validationWrapper(adminController.changePassword)
  );

// Data access routes (filtered based on admin role)
router.route("/medicals").get(adminController.getAllMedicals);
router.route("/orders").get(adminController.getAllOrders);

// Super admin only routes
router.use(superAdminOnly);
router
  .route("/")
  .post(createAdminValidation, validationWrapper(adminController.createAdmin))
  .get(adminController.getAllAdmins);
router.route("/role").patch(adminController.updateAdminRole);
router.route("/:adminId").delete(adminController.deleteAdmin);

export default router; 