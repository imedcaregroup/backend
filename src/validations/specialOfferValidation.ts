import { check } from "express-validator";

export const createSpecialOfferValidation = [
  check("medicalId")
    .notEmpty()
    .withMessage("Please provide medical ID")
    .isInt()
    .withMessage("Medical ID must be an integer"),
  check("subCategoryIds")
    .isArray({ min: 1 })
    .withMessage("Please provide at least one subcategory ID"),
  check("price")
    .notEmpty()
    .withMessage("Please provide price")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number"),

  check("startsAt")
    .notEmpty()
    .withMessage("Please provide price")
    .bail()
    .trim()
    .isDate({ format: "MM/DD/YYYY", strictMode: true })
    .withMessage("Starts at must be a valid date in MM/DD/YYYY format"),

  check("endsAt")
    .notEmpty()
    .withMessage("Please provide price")
    .bail()
    .trim()
    .isDate({ format: "MM/DD/YYYY", strictMode: true })
    .withMessage("Starts at must be a valid date in MM/DD/YYYY format"),

  check("imageUrl_az").notEmpty().withMessage("Please provide image URL"),
  check("imageUrl_en").notEmpty().withMessage("Please provide image URL"),
  check("imageUrl_ru").notEmpty().withMessage("Please provide image URL"),
  check("title_az").notEmpty().withMessage("Please provide title"),
  check("title_en").notEmpty().withMessage("Please provide title"),
  check("title_ru").notEmpty().withMessage("Please provide title"),
  check("priority")
    .optional({ nullable: true, checkFalsy: true })
    .isInt()
    .withMessage("Priority must be an integer"),
  check("description_az").optional({ nullable: true, checkFalsy: true }),
  check("description_en").optional({ nullable: true, checkFalsy: true }),
  check("description_ru").optional({ nullable: true, checkFalsy: true }),
  check("originalPrice")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ gt: 0 })
    .withMessage("Original price must be a positive number"),
  check("discountType")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["PERCENTAGE", "FIXED"])
    .withMessage("Discount type must be either 'PERCENTAGE' or 'FIXED'"),
  check("discountValue")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ gt: 0 })
    .withMessage("Discount value must be a positive number if provided"),
  check("isActive").optional({ nullable: true, checkFalsy: true }).isBoolean(),
];
