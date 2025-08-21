import { Router } from "express";
import EmployeeController from "../controllers/employeeController";

const employeeController = EmployeeController();

const router = Router();

router.route("/doctors").get(employeeController.getDoctors);

export default router;