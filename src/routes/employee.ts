import { Router } from "express";
import EmployeeController from "../controllers/employeeController";

const employeeController = EmployeeController();

const router = Router();

router.route("/").get(employeeController.getEmployees);
router.route('/doctorsByCategory').get(employeeController.getDoctorsByCategory);

export default router;