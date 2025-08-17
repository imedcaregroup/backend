import prisma from "../config/db";

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

}