import { Router } from "express";
import ServiceController from "../controllers/serviceController";
import { authMiddleware } from "../middlewares/auth";

const serviceController = ServiceController();

const router = Router();

router.use(authMiddleware);
router.route("/").get(serviceController.getServices);

export default router;
