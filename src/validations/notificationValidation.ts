import { check } from "express-validator";

export const createNotificationValidation = [
  check("title").notEmpty().withMessage("Please provide title"),
  check("body").notEmpty().withMessage("Please provide body"),
];
