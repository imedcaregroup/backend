import { Router } from "express";
import userrRoute from "./user";
import serviceRoute from "./service";
import employeeRoute from "./employee";
import categoryRoute from "./category";
import subCategoryRoute from "./subCategory";
import medicalRoute from "./medical";
import orderRoute from "./order";
import availbilityRoute from "./availability";
import addressRoute from "./address";
import fcmTokenRoute from "./fcmToken";
import paymentRoute from "./payment";
import adminRoute from "./admin";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// Public routes
router.use("/user", userrRoute);
router.use("/admin", adminRoute);
router.use("/medical", medicalRoute);

// 🔐 Auth-protected user routes
router.use(authMiddleware);
router.use("/service", serviceRoute);
router.use("/employee", employeeRoute);
router.use("/category", categoryRoute);
router.use("/subcategory", subCategoryRoute);
router.use("/order", orderRoute);
router.use("/availability", availbilityRoute);
router.use("/address", addressRoute);
router.use("/token", fcmTokenRoute);
router.use("/payment", paymentRoute);

export default router;
