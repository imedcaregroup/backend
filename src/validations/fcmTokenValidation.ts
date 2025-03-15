import { check } from "express-validator";

export const setFcmTokenValidation = [
  check("token").notEmpty().withMessage("Please provide token"),
];
