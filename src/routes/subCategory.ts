import { Router } from "express";
import SubCategoryController from "../controllers/subCategoryController";

const subCategoryController = SubCategoryController();

const router = Router();

router.route("/").get(subCategoryController.getSubCategories);

export default router;
