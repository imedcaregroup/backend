import { check } from "express-validator";

export const createAddressValidation = [
  check("shortName").notEmpty().withMessage("Please provide shortName"),
  check("city").notEmpty().withMessage("Please provide city"),
  check("district").notEmpty().withMessage("Please provide district"),
  check("address").notEmpty().withMessage("Please provide address"),
  check("entrance").optional({ nullable: true, checkFalsy: true }),
  check("intercom").optional({ nullable: true, checkFalsy: true }),
  check("floor").optional({ nullable: true, checkFalsy: true }).isInt(),
  check("apartment").optional({ nullable: true, checkFalsy: true }),
  check("lat").notEmpty().withMessage("Please provide latitude").isFloat(),
  check("lng").notEmpty().withMessage("Please provide longitude").isFloat(),
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
