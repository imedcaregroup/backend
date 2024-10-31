import { Router } from "express";
import userrRoute from "./user";
import serviceRoute from "./service";

const router = Router();

router.use("/user", userrRoute);
router.use("/service", serviceRoute);

export default router;
