import { check } from "express-validator";
import prisma from "../config/db";

export const createOrderValidation = [
  // check("serviceId").notEmpty().withMessage("Please provide service"),
  // check("categoryId").notEmpty().withMessage("Please provide category"),
  // check("subCategoryId").notEmpty().withMessage("Please provide subCategoryId"),
  check("medicalId").notEmpty().withMessage("Please provide medical"),
  check('employeeId')
      .optional({ nullable: true, checkFalsy: true })
      .isInt()
      .withMessage('Please provide employeeId')
      .bail()
      .custom(async (value) => {
        const employee = await prisma.employee.findUnique({
          where: { id: value },
        });

        if (!employee) {
          throw new Error('Employee with given ID does not exist');
        }
      }),
  check("address").notEmpty().withMessage("Please provide address"),
  check("lat").optional({ nullable: true, checkFalsy: true }).isFloat(),
  check("lng").optional({ nullable: true, checkFalsy: true }).isFloat(),
  check("entrance").optional({nullable: true, checkFalsy: true}),
  check("intercom").optional({nullable: true, checkFalsy: true}),
  check("floor").optional({nullable: true, checkFalsy: true}).isInt(),
  check("apartment").optional({nullable: true, checkFalsy: true}),
  check("additionalInfo").optional({ nullable: true, checkFalsy: true }),
  check("date").notEmpty().withMessage("Please provide date"),
  check("startTime").notEmpty().withMessage("Please provide startTime"),
];

export const acceptOrRejectOrderValidation = [
  check("orderStatus").notEmpty().withMessage("Please provide orderStatus"),
  check("declinedReason").optional({ nullable: true, checkFalsy: true }),
];

export const employeeStatusChangingValidation = [
    check("employeeStatus").notEmpty().withMessage("Please provide employeeStatus")
];