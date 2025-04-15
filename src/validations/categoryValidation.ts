import { check } from "express-validator";
import prisma from "../config/db";

export const createCategoryValidation = [
    check('iconUrl').optional({nullable: true}),
    check('name').notEmpty().withMessage('Please provide name'),
    check('serviceId')
        .notEmpty()
        .withMessage('Please provide serviceId')
        .bail() // остановит дальнейшие проверки, если поле пустое
        .custom(async (value) => {
            const service = await prisma.service.findUnique({
                where: { id: parseInt(value) },
            });

            if (!service) {
                throw new Error('Service with given ID does not exist');
            }
        })
];

export const updateCategoryValidation = [
    check('iconUrl').optional({nullable: true}),
    check('name').notEmpty().withMessage('Please provide name'),
    check('serviceId')
        .notEmpty()
        .withMessage('Please provide serviceId')
        .bail() // остановит дальнейшие проверки, если поле пустое
        .custom(async (value) => {
            const service = await prisma.service.findUnique({
                where: { id: parseInt(value) },
            });

            if (!service) {
                throw new Error('Service with given ID does not exist');
            }
        })
];