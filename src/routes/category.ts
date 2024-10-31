import { Router } from "express";
import CategoryController from "../controllers/categoryController";

const categoryController = CategoryController();

const router = Router();

router.route("/").get(categoryController.getCategories);

export default router;
