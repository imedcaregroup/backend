import { check } from "express-validator";

export const createAdminValidation = [
  check("name").notEmpty().withMessage("Please provide name"),
  check("email").isEmail().withMessage("Please provide a valid email"),
  check("password")
    .notEmpty()
    .withMessage("Please provide password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("role")
    .optional()
    .isIn(["ADMIN", "SUPER_ADMIN"])
    .withMessage("Role must be either ADMIN or SUPER_ADMIN"),
];

export const loginAdminValidation = [
  check("email").isEmail().withMessage("Please provide a valid email"),
  check("password").notEmpty().withMessage("Please provide password"),
];

export const updateAdminValidation = [
  check("name").optional().notEmpty().withMessage("Please provide name"),
  check("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email"),
  check("role")
    .optional()
    .isIn(["ADMIN", "SUPER_ADMIN"])
    .withMessage("Role must be either ADMIN or SUPER_ADMIN"),
];

export const changePasswordValidation = [
  check("currentPassword")
    .notEmpty()
    .withMessage("Please provide current password"),
  check("newPassword")
    .notEmpty()
    .withMessage("Please provide new password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm new password")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match new password");
      }
      return true;
    }),
];
