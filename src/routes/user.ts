import { Router } from "express";
import UserController from "../controllers/userController";
import { authMiddleware } from "../middlewares/auth";
const userController = UserController();

const router = Router();

router.route("/google").post(userController.loginUserWithGoogle);

router.use(authMiddleware);
router.route("/me").get(userController.getMyProfile);

export default router;
