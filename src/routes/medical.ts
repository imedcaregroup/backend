import { Router } from "express";
import MedicalController from "../controllers/medicalController";

const medicalController = MedicalController();

const router = Router();

router.route("/").get(medicalController.getMedicalsBySubcategory);

export default router;
