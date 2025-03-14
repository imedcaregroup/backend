import { Router } from "express";
import userrRoute from "./user";
import serviceRoute from "./service";
import categoryRoute from "./category";
import subCategoryRoute from "./subCategory";
import medicalRoute from "./medical";
import orderRoute from "./order";
import availbilityRoute from "./availability";
import addressRoute from "./address";
import fcmTokenRoute from "./fcmToken";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use("/user", userrRoute);

router.use(authMiddleware);
router.use("/service", serviceRoute);
router.use("/category", categoryRoute);
router.use("/subcategory", subCategoryRoute);
router.use("/medical", medicalRoute);
router.use("/order", orderRoute);
router.use("/availability", availbilityRoute);
router.use("/address", addressRoute);
router.use("/token", fcmTokenRoute);

export default router;
