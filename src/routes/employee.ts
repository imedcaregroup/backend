import { Router } from "express";
import EmployeeController from "../controllers/employeeController";

const employeeController = EmployeeController();

const router = Router();

router.route("/doctors").get(employeeController.getDoctors);
router.route("/doctors/:id").get(employeeController.getDoctor);
router.route("/orders").get(employeeController.getOrders);

export default router;
