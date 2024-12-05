import { Router } from "express";
import UserController from "../controllers/userController";
import { authMiddleware } from "../middlewares/auth";
import {
  setUserProfileValidation,
  createUserValidation,
  loginUserValidation,
  updatePasswordValidation,
} from "../validations/userValidation";
import { validationWrapper } from "../utils/helpers";
const userController = UserController();

const router = Router();

router.route("/google").post(userController.loginUserWithGoogle);
router
  .route("/signup")
  .post(createUserValidation, validationWrapper(userController.signUp));

router
  .route("/login")
  .post(loginUserValidation, validationWrapper(userController.logIn));

router.use(authMiddleware);
router.route("/me").get(userController.getMyProfile);
router
  .route("/profile")
  .patch(
    setUserProfileValidation,
    validationWrapper(userController.setMyProfile)
  )
  .delete(userController.deleteMyProfile);

router
  .route("/password")
  .patch(
    updatePasswordValidation,
    validationWrapper(userController.updatePassword)
  );

export default router;
