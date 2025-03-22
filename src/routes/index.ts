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
import paymentRoute from "./payment";
import adminRoute from "./admin";

const router = Router();

router.use("/user", userrRoute);
// Admin routes with their own authentication
router.use("/admin", adminRoute);

router.use(authMiddleware);
router.use("/service", serviceRoute);
router.use("/category", categoryRoute);
router.use("/subcategory", subCategoryRoute);
router.use("/medical", medicalRoute);
router.use("/order", orderRoute);
router.use("/availability", availbilityRoute);
router.use("/address", addressRoute);
router.use("/token", fcmTokenRoute);
router.use("/payment", paymentRoute);
export default router;
