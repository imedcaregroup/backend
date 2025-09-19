import { check } from "express-validator";
import prisma from "../config/db";

export const createEmployeeValidation = [
  check("imageUrl").optional({ nullable: true }),
  check("name").notEmpty().withMessage("Please provide name"),
  check("surName").notEmpty().withMessage("Please provide surName"),
  check("position").notEmpty().withMessage("Please provide position"),
  check("patientsCount").optional().isInt({ min: 0 }).withMessage("Please provide positionsCount"),
  check(["about_az", "about_en", "about_ru"])
    .optional({ nullable: true })
    .isString(),
  check(["experienceYears_az", "experienceYears_en", "experienceYears_ru"])
    .optional({ nullable: true })
    .isString(),
  check("type")
    .notEmpty()
    .withMessage("Please provide type")
    .isIn(["NURSE", "DOCTOR"])
    .withMessage("Type must be one of the: NURSE, DOCTOR"),
  check("userId")
    .notEmpty()
    .isInt()
    .withMessage("Please provide userId")
    .bail()
    .custom(async (value) => {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(value) },
      });

      if (!user) {
        throw new Error("User with given ID does not exist");
      }
    }),

  check("medicals")
    .notEmpty()
    .isArray({ min: 1})
    .withMessage("Medical(s) must be list"),
  check("medicals.*")
    .isInt()
    .withMessage("Medical id must be number"),

  check("prices")
    .optional()
    .isArray({ min: 0 })
    .withMessage("Prices must be list"),
  check("prices.*.subCategoryId")
    .isInt()
    .withMessage("subCategoryId must be number"),
  check("prices.*.price").isFloat().withMessage("prices must be float"),
];

export const updateEmployeeValidation = [
  check("id")
    .notEmpty()
    .isInt()
    .withMessage("Invalid employee id")
    .bail()
    .custom(async (value) => {
      const employee = await prisma.employee.findUnique({
        where: { id: parseInt(value) },
      });

      if (!employee) {
        throw new Error("Employee with given ID does not exist");
      }
    }),
  check("imageUrl").optional({ nullable: true }),
  check("name").notEmpty().withMessage("Please provide name"),
  check("surName").notEmpty().withMessage("Please provide surName"),
  check("position").notEmpty().withMessage("Please provide position"),
  check("patientsCount").optional().isInt({ min: 0 }).withMessage("Please provide positionsCount"),
  check(["about_az", "about_en", "about_ru"])
      .optional({ nullable: true })
      .isString(),
  check(["experienceYears_az", "experienceYears_en", "experienceYears_ru"])
      .optional({ nullable: true })
      .isString(),
  check("type")
    .notEmpty()
    .withMessage("Please provide type")
    .isIn(["NURSE", "DOCTOR"])
    .withMessage("Type must be one of the: NURSE, DOCTOR"),
  check("userId")
    .notEmpty()
    .isInt()
    .withMessage("Please provide userId")
    .bail()
    .custom(async (value) => {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(value) },
      });

      if (!user) {
        throw new Error("User with given ID does not exist");
      }
    }),

  check("medicals")
      .notEmpty()
      .isArray({ min: 1})
      .withMessage("Medical(s) must be list"),
  check("medicals.*")
      .isInt()
      .withMessage("Medical id must be number"),

  check("prices")
    .optional()
    .isArray({ min: 0 })
    .withMessage("Prices must be list"),
  check("prices.*.subCategoryId")
    .isInt()
    .withMessage("subCategoryId must be number"),
  check("prices.*.price").isFloat().withMessage("prices must be float"),
];

export const deleteEmployeeValidation = [
  check("id")
    .notEmpty()
    .isInt()
    .withMessage("Invalid employee id")
    .bail()
    .custom(async (value) => {
      const employee = await prisma.employee.findUnique({
        where: { id: parseInt(value) },
      });

      if (!employee) {
        throw new Error("Employee with given ID does not exist");
      }
    }),
];
