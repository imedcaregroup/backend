import { check } from "express-validator";
import prisma from "../config/db";
import { isNumber } from "firebase-admin/lib/utils/validator";

export const createCategoryValidation = [
  check("iconUrl").optional({ nullable: true }),
  check("name").notEmpty().withMessage("Please provide name"),
  check("serviceId")
    .notEmpty()
    .isInt()
    .withMessage("Please provide serviceId")
    .bail() // остановит дальнейшие проверки, если поле пустое
    .custom(async (value) => {
      const service = await prisma.service.findUnique({
        where: { id: parseInt(value) },
      });

      if (!service) {
        throw new Error("Service with given ID does not exist");
      }
    }),
];

export const updateCategoryValidation = [
  check("iconUrl").optional({ nullable: true }),
  check("name").notEmpty().withMessage("Please provide name"),
  check("serviceId")
    .notEmpty()
    .isInt()
    .withMessage("Please provide serviceId")
    .bail()
    .custom(async (value) => {
      const service = await prisma.service.findUnique({
        where: { id: parseInt(value) },
      });

      if (!service) {
        throw new Error("Service with given ID does not exist");
      }
    }),
];

export const createSubCategoryValidation = [
  check("iconUrl").optional({ nullable: true }),
  check("name").notEmpty().withMessage("Please provide name"),
  check("parentId")
    .notEmpty()
    .isInt()
    .withMessage("Please provide parentId")
    .bail()
    .custom(async (value) => {
      const category = await prisma.category.findUnique({
        where: { id: value },
      });

      if (!category) {
        throw new Error("Category with given ID does not exist");
      }
    }),
];

export const updateSubCategoryValidation = [
  check("iconUrl").optional({ nullable: true }),
  check("name").notEmpty().withMessage("Please provide name"),
  check("parentId")
    .notEmpty()
    .isInt()
    .withMessage("Please provide parentId")
    .bail()
    .custom(async (value) => {
      const category = await prisma.category.findUnique({
        where: { id: value },
      });

      if (!category) {
        throw new Error("Category with given ID does not exist");
      }
    }),
];
