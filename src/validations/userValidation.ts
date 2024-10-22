import { check } from "express-validator";

export const createUserValidation = [
  check("name").notEmpty().withMessage("Please provide name"),
  check("email").notEmpty().withMessage("Please provide the email"),
  check("url").notEmpty().withMessage("Please provide url"),
];

export const setUserProfileValidation = [
  check("mobileNumber").notEmpty().withMessage("Please provide mobileNumber"),
  check("name").notEmpty().withMessage("Please provide name"),
  check("surName").notEmpty().withMessage("Please provide surName"),
  check("pytroNym").optional(),
  check("dob").notEmpty().withMessage("Please provide dob"),
  check("gender").optional(),
  check("country").notEmpty().withMessage("Please provide country"),
  check("address").notEmpty().withMessage("Please provide address"),
  check("lat").optional(),
  check("lng").optional(),
];
