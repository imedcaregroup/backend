import {Router} from "express";
import EmployeeController from "../controllers/employeeController";

const employeeController = EmployeeController();

const router = Router();

router.route("/").get(employeeController.getEmployees);

export default router;