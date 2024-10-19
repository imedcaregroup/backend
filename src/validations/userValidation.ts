import { check } from "express-validator";

export const createUserValidation = [
  check("name").notEmpty().withMessage("Please provide name"),
  check("email").notEmpty().withMessage("Please provide the email"),
  check("url").notEmpty().withMessage("Please provide url"),
];
