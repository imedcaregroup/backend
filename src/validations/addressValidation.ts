import { check } from "express-validator";

export const createAddressValidation = [
  check("shortName").notEmpty().withMessage("Please provide shortName"),
  check("city").notEmpty().withMessage("Please provide city"),
  check("district").notEmpty().withMessage("Please provide district"),
  check("address").notEmpty().withMessage("Please provide address"),
  check("entrance").optional().notEmpty().withMessage("Please provide entrance"),
  check("intercom").optional().notEmpty().withMessage("Please provide intercom"),
  check("floor").optional().notEmpty().withMessage("Please provide floor"),
  check("apartment").optional().notEmpty().withMessage("Please provide apartment"),
  check("lat").notEmpty().withMessage("Please provide latitude"),
  check("lng").notEmpty().withMessage("Please provide longitude"),
];

export const updateAddressValidation = [
  check("shortName")
    .optional()
    .notEmpty()
    .withMessage("Please provide shortName"),
  check("city").optional().notEmpty().withMessage("Please provide city"),
  check("district")
    .optional()
    .notEmpty()
    .withMessage("Please provide district"),
  check("address").optional().notEmpty().withMessage("Please provide address"),
  check("lat").optional().notEmpty().withMessage("Please provide latitude"),
  check("lng").optional().notEmpty().withMessage("Please provide longitude"),
];
