import { Router } from "express";
import userrRoute from "./user";
import serviceRoute from "./service";
import categoryRoute from "./category";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use("/user", userrRoute);

router.use(authMiddleware);
router.use("/service", serviceRoute);
router.use("/category", categoryRoute);

export default router;
