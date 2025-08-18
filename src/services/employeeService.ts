import prisma from "../config/db";
import {isHigherPrecedenceThanAwait} from "@typescript-eslint/eslint-plugin/dist/util";
import {sendSuccessResponse} from "../utils/response";

export class EmployeeService {

    public async getDoctorsByCategory(categoryId: number): Promise<any> {

        const subIds = (
            await prisma.subCategory.findMany({
                where: { categoryId },
                select: { id: true },
            })
        ).map(item => item.id);

        if (!subIds.length) {
            throw new Error('There is no subCategory for passed category');
        }

        return await prisma.employee.findMany({
            where: {
                type: "DOCTOR",
                employeeCategories: {
                    some: {
                        subCategoryId: {in: subIds}
                    }
                }
            },
            include: {
                employeeCategories: true
            }
        })
    };

    public async createEmployee(data: any): Promise<any> {
        const {name, surName, type, position, imageUrl, userId, medicalId, prices} = data;

        const existingEmployeeByUser = await prisma.employee.findFirst({
            where: {userId}
        });

        if (existingEmployeeByUser) {
            throw new Error('Employee for this user is exists');
        }

        const employee = await prisma.employee.create({
            data: {
                name,
                surName,
                type,
                position,
                imageUrl,
                user: {connect: {id: userId}},
                medical: {connect: {id: medicalId}},
            }
        });

        // sync employee-category
        if (prices) {
            await this.syncEmployeeCategories(employee.id, prices);
        }

        return await prisma.employee.findUnique({
            where: {id: employee.id},
            include: {
                employeeCategories: true
            }
        });
    }

    public async updateEmployee(id: number, data: any): Promise<any> {
        const {name, surName, type, position, imageUrl, userId, medicalId, prices} = data;

        const employee = await prisma.employee.update({
            where: {id},
            data: {
                name,
                surName,
                type,
                position,
                imageUrl,
                user: {connect: {id: userId}},
                medical: {connect: {id: medicalId}},
            }
        });

        // sync employee-category
        if (prices) {
            await this.syncEmployeeCategories(employee.id, prices);
        }

        return await prisma.employee.findUnique({
            where: {id: employee.id},
            include: {
                employeeCategories: true
            }
        });
    }

    public async deleteEmployee(employeeId: number): Promise<void> {
        const orderExists = await prisma.order.findFirst({
            where: { employeeId },
        });

        if (orderExists) {
            throw new Error("Cannot delete this employee cause it used in order(s)");
        }

        await prisma.employeeCategory.deleteMany({
            where: {employeeId}
        });

        await prisma.employee.delete({
            where: {
                id: employeeId
            }
        });
    }

    protected async syncEmployeeCategories(employeeId: number, prices: any): Promise<any> {
        // fetch current categories
        const currentItems = await prisma.employeeCategory.findMany({
            where: {employeeId}
        });

        const inputSubCategories = prices.map((item: any) => Number(item.subCategoryId));

        await prisma.employeeCategory.deleteMany({
            where: {
                employeeId,
                subCategoryId: { notIn: inputSubCategories }
            }
        });

        for (const item of prices) {
            const subCategory = await prisma.subCategory.findUnique({
                where: {id: item.subCategoryId}
            });

            if (!subCategory) {
                continue;
            }

            await prisma.employeeCategory.upsert({
                where: {
                    employeeId_subCategoryId: {
                        employeeId,
                        subCategoryId: Number(item.subCategoryId)
                    }
                },
                update: { price: Number(item.price) },
                create: {
                    employeeId,
                    subCategoryId: Number(item.subCategoryId),
                    price: Number(item.price)
                }
            });
        }

        return await prisma.employeeCategory.findMany({
            where: {employeeId}
        });
    }

}