import { Router } from "express";
import ServiceController from "../controllers/serviceController";

const serviceController = ServiceController();

const router = Router();

router.route("/").get(serviceController.getServices);

export default router;
