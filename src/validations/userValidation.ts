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
  check("pytroNym").optional({ nullable: true, checkFalsy: true }),
  check("dob").notEmpty().withMessage("Please provide dob"),
  check("gender").optional({ nullable: true, checkFalsy: true }),
  check("country").notEmpty().withMessage("Please provide country"),
  check("address").notEmpty().withMessage("Please provide address"),
  check("imageUrl").optional({ nullable: true, checkFalsy: true }),
  check("lat").optional({ nullable: true, checkFalsy: true }),
  check("lng").optional({ nullable: true, checkFalsy: true }),
];
