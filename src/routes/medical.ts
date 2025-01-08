import { Router } from "express";
import MedicalController from "../controllers/medicalController";

const medicalController = MedicalController();

const router = Router();

router.route("/").get(medicalController.getMedicalsBySubcategory);
router.route("/getTopMedicalPartners").get(medicalController.getTopMedicalPartners);
router.route("/getAll").get(medicalController.getAll);
router.route("/getById/:id").get(medicalController.getMedicalById);

export default router;
