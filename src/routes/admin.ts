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
import CategoryController from "../controllers/categoryController";
import {acceptOrRejectOrderValidation} from "../validations/orderValidation";
import {
  createCategoryValidation,
  createSubCategoryValidation,
  updateCategoryValidation, updateSubCategoryValidation
} from "../validations/categoryValidation";
import SubCategoryController from "../controllers/subCategoryController";

const adminController = AdminController();
const orderController = OrderController();
const categoryController = CategoryController();
const subCategoryController = SubCategoryController();
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
router.route("/orders/:id/start").patch(orderController.startOrder);
router.route("/orders/:id/complete").patch(orderController.completeOrder);

// Admin medicals
router.route("/medicals").get(adminController.getAllMedicals);

// category
router
    .route('/categories')
    .post(createCategoryValidation, validationWrapper(categoryController.createCategory));
router
    .route('/categories/:id')
    .patch(updateCategoryValidation, validationWrapper(categoryController.updateCategory))
    .delete(categoryController.deleteCategory);

router
    .route('/subcategories')
    .post(createSubCategoryValidation, validationWrapper(subCategoryController.createSubCategory));
router
    .route('/subcategories/:id')
    .patch(updateSubCategoryValidation, validationWrapper(subCategoryController.updateSubCategory))
    .delete(subCategoryController.deleteSubCategory);

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
