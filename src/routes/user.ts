import { Router } from "express";
import UserController from "../controllers/userController";
import { authMiddleware } from "../middlewares/auth";
import { setUserProfileValidation } from "../validations/userValidation";
import { validationWrapper } from "../utils/helpers";
const userController = UserController();

const router = Router();

router.route("/google").post(userController.loginUserWithGoogle);

router.use(authMiddleware);
router.route("/me").get(userController.getMyProfile);
router
  .route("/profile")
  .patch(
    setUserProfileValidation,
    validationWrapper(userController.setMyProfile)
  );

export default router;
