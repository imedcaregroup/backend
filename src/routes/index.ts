import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import addressRoute from "./address";
import adminRoute from "./admin";
import availbilityRoute from "./availability";
import categoryRoute from "./category";
import employeeRoute from "./employee";
import fcmTokenRoute from "./fcmToken";
import medicalRoute from "./medical";
import orderRoute from "./order";
import paymentRoute from "./payment";
import serviceRoute from "./service";
import fileRoute from "./file";
import subCategoryRoute from "./subCategory";
import userrRoute from "./user";
import specialOffersRoute from "./specialOffers";

const router = Router();

// Public routes
router.use("/user", userrRoute);
router.use("/admin", adminRoute);
router.use("/medical", medicalRoute);
router.use("/payment", paymentRoute);

// 🔐 Auth-protected user routes
router.use(authMiddleware);
router.use("/file", fileRoute);
router.use("/service", serviceRoute);
router.use("/employee", employeeRoute);
router.use("/category", categoryRoute);
router.use("/subcategory", subCategoryRoute);
router.use("/order", orderRoute);
router.use("/availability", availbilityRoute);
router.use("/address", addressRoute);
router.use("/token", fcmTokenRoute);
router.use("/special-offers", specialOffersRoute);

export default router;
