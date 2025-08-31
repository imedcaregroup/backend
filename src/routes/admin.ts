import { Router } from "express";
import { createNotificationValidation } from "../validations/notificationValidation";
import AdminController from "../controllers/adminController";
import CategoryController from "../controllers/categoryController";
import EmployeeController from "../controllers/employeeController";
import NotificationsController from "../controllers/notificationsController";
import OrderController from "../controllers/orderController";
import SubCategoryController from "../controllers/subCategoryController";
import { adminAuthMiddleware, superAdminOnly } from "../middlewares/adminAuth";
import { validationWrapper } from "../utils/helpers";
import {
  changePasswordValidation,
  createAdminValidation,
  loginAdminValidation,
  updateAdminValidation,
} from "../validations/adminValidation";
import {
  createCategoryValidation,
  createSubCategoryValidation,
  updateCategoryValidation,
  updateSubCategoryValidation,
} from "../validations/categoryValidation";
import {
  createEmployeeValidation,
  deleteEmployeeValidation,
  updateEmployeeValidation,
} from "../validations/employeeValidation";
import { acceptOrRejectOrderValidation } from "../validations/orderValidation";

const adminController = AdminController();
const orderController = OrderController();
const categoryController = CategoryController();
const subCategoryController = SubCategoryController();
const employeeController = EmployeeController();
const notificationsController = NotificationsController();
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
  validationWrapper(orderController.acceptOrRejectOrder),
);
router.route("/orders/:id/start").patch(orderController.startOrderForAdmin);
router.route("/orders/:id/complete").patch(orderController.completeOrder);

// Admin medicals
router.route("/medicals").get(adminController.getAllMedicals);

// category
router
  .route("/categories")
  .post(
    createCategoryValidation,
    validationWrapper(categoryController.createCategory),
  );
router
  .route("/categories/:id")
  .patch(
    updateCategoryValidation,
    validationWrapper(categoryController.updateCategory),
  )
  .delete(categoryController.deleteCategory);

router
  .route("/subcategories")
  .post(
    createSubCategoryValidation,
    validationWrapper(subCategoryController.createSubCategory),
  );
router
  .route("/subcategories/:id")
  .patch(
    updateSubCategoryValidation,
    validationWrapper(subCategoryController.updateSubCategory),
  )
  .delete(subCategoryController.deleteSubCategory);

// employee
router.route("/employees").get(employeeController.getEmployees);
router
  .route("/employees")
  .post(
    createEmployeeValidation,
    validationWrapper(employeeController.createEmployee),
  );
router
  .route("/employees/:id")
  .patch(
    updateEmployeeValidation,
    validationWrapper(employeeController.updateEmployee),
  );
router
  .route("/employees/:id")
  .delete(
    deleteEmployeeValidation,
    validationWrapper(employeeController.deleteEmployee),
  );

// Notifications
router
  .route("/notification")
  .post(
    createNotificationValidation,
    validationWrapper(notificationsController.createNotification),
  );

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
