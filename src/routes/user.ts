import { Router } from "express";
import UserController from "../controllers/userController";
import { authMiddleware } from "../middlewares/auth";
import {
  setUserProfileValidation,
  createUserValidation,
  loginUserValidation,
  updatePasswordValidation,
  VerifyEmailValidation,
} from "../validations/userValidation";
import { validationWrapper } from "../utils/helpers";
import multer, { FileFilterCallback } from "multer";
import { UserRequest } from "../types";

// Set up Multer storage for S3 file upload
const storage = multer.memoryStorage(); // Store the file in memory before uploading it to S3

const fileFilter = (
  req: UserRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/svg+xml",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // Max file size 10MB
});

const userController = UserController();

const router = Router();

router.route("/google").post(userController.loginUserWithGoogle);
router
  .route("/signup")
  .post(createUserValidation, validationWrapper(userController.signUp));

router
  .route("/login")
  .post(loginUserValidation, validationWrapper(userController.logIn));
router
  .route("/verify-email")
  .post(VerifyEmailValidation, validationWrapper(userController.verifyEmail));
router.use(authMiddleware);
router.route("/me").get(userController.getMyProfile);
router
  .route("/profile")
  .patch(
    upload.single("image"),
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
