import { check } from "express-validator";

export const createUserValidation = [
  check("name").notEmpty().withMessage("Please provide name"),
  check("email").notEmpty().withMessage("Please provide the email"),
  check("password").notEmpty().withMessage("Please provide password"),
];

export const loginUserValidation = [
  check("email").notEmpty().withMessage("Please provide the email"),
  check("password").notEmpty().withMessage("Please provide password"),
];

export const VerifyEmailValidation = [
  check("email").notEmpty().withMessage("Please provide the email"),
];
export const setUserProfileValidation = [
  check("mobileNumber")
    .optional()
    .notEmpty()
    .withMessage("Please provide mobileNumber"),
  check("name")
    .optional()
    .notEmpty()
    .notEmpty()
    .withMessage("Please provide name"),
  check("surName").optional().notEmpty().withMessage("Please provide surName"),
  check("pytroNym").optional({ nullable: true, checkFalsy: true }),
  check("dob").optional().notEmpty().withMessage("Please provide dob"),
  check("gender").optional({ nullable: true, checkFalsy: true }),
  check("country").optional().notEmpty().withMessage("Please provide country"),
  check("address").optional().notEmpty().withMessage("Please provide address"),
  check("imageUrl").optional({ nullable: true, checkFalsy: true }),
  check("lat").optional({ nullable: true, checkFalsy: true }),
  check("lng").optional({ nullable: true, checkFalsy: true }),
];

export const updatePasswordValidation = [
  check("password").notEmpty().withMessage("Please provide password"),
  check("confirmPassword")
    .notEmpty()
    .withMessage("Please provide confirmPassword"),
];
