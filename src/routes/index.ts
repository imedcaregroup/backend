import { Router } from "express";
import userrRoute from "./user";
import serviceRoute from "./service";
import categoryRoute from "./category";
import subCategoryRoute from "./subCategory";
import medicalRoute from "./medical";
import orderRoute from "./order";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use("/user", userrRoute);

router.use(authMiddleware);
router.use("/service", serviceRoute);
router.use("/category", categoryRoute);
router.use("/subcategory", subCategoryRoute);
router.use("/medical", medicalRoute);
router.use("/order", orderRoute);

export default router;
