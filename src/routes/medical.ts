import { Router } from "express";
import MedicalController from "../controllers/medicalController";
import { adminAuthMiddleware } from "../middlewares/adminAuth";

const medicalController = MedicalController();

const router = Router();

// Public routes
router.route("/").get(medicalController.getMedicalsBySubcategory);
router
  .route("/getTopMedicalPartners")
  .get(medicalController.getTopMedicalPartners);
router.route("/getAll").get(medicalController.getAll);
router.route("/getById/:id").get(medicalController.getMedicalById);
router.route("/getServiceFee/:id").get(medicalController.getServiceFee);

// Admin protected routes
router.use(adminAuthMiddleware);
router
  .route("/admin/searchCategories")
  .get(medicalController.searchMedicalSubCategories);

export default router;
