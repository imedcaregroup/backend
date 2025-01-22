import { check } from "express-validator";

export const createOrderValidation = [
  // check("serviceId").notEmpty().withMessage("Please provide service"),
  // check("categoryId").notEmpty().withMessage("Please provide category"),
  // check("subCategoryId").notEmpty().withMessage("Please provide subCategoryId"),
  check("medicalId").notEmpty().withMessage("Please provide medical"),
  check("address").notEmpty().withMessage("Please provide address"),
  check("lat").optional({ nullable: true, checkFalsy: true }),
  check("lng").optional({ nullable: true, checkFalsy: true }),
  check("additionalInfo").optional({ nullable: true, checkFalsy: true }),
  check("date").notEmpty().withMessage("Please provide date"),
  check("startTime").notEmpty().withMessage("Please provide startTime"),
];

export const acceptOrRejectOrderValidation = [
  check("orderStatus").notEmpty().withMessage("Please provide orderStatus"),
  check("declinedReason").optional({ nullable: true, checkFalsy: true }),
];
