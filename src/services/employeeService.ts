import prisma from "../config/db";
import {HttpException} from "../utils/exception";
import {formatTime} from "../utils/helpers";

const daysMap: Record<number, string> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday"
};

export class EmployeeService {
  public async getDoctors(categoryId: number | null): Promise<any> {
    let condition: any = {
      include: {
        medical: { select: { id: true, name: true } },
        employeeCategories: {
          include: {
            subCategory: true,
          },
        },
      },
      where: {
        type: "DOCTOR",
      },
    };

    if (categoryId) {
      const subIds = (
        await prisma.subCategory.findMany({
          where: { categoryId },
          select: { id: true },
        })
      ).map((item) => item.id);

      if (!subIds.length) {
        throw new Error("There is no subCategory for passed category");
      }

      condition.where = {
        ...condition.where,
        employeeCategories: {
          some: {
            subCategoryId: { in: subIds },
          },
        },
      };
    }

    let employees = await prisma.employee.findMany(condition);

    return employees.map((employee: any) => {
      return {
        id: employee.id,
        name: employee.name,
        surName: employee.surName,
        position: employee.position,
        imageUrl: employee.imageUrl,
        medical: {
          id: employee.medical.id,
          name: employee.medical.name,
        },
        services: employee.employeeCategories.map((item: any) => {
          return {
            categoryId: item.subCategory.categoryId,
            subCategoryId: item.subCategoryId,
            name: item.subCategory.name,
            az: item.subCategory.name_az,
            ru: item.subCategory.name_ru,
            en: item.subCategory.name_en,
            price: item.price.toString() + " azn",
          };
        }),
      };
    });
  }

  public async getDoctor(id: number): Promise<any> {
      const employee = await prisma.employee.findUnique({
          select: {
              id: true,
              name: true,
              surName: true,
              position: true,
              experienceYears: true,
              about_az: true,
              about_ru: true,
              about_en: true,
              imageUrl: true,
              medical: { select: { id: true, name: true, iconUrl: true } },
              employeeCategories: {
                  include: {
                      subCategory: {
                          include: {
                              category: true
                          }
                      },
                  },
              },
          },
          where: {
              type: "DOCTOR",
              id
          },
      });
      if (!employee) {
          throw new HttpException(404, 'Doctor not found');
      }

      return {
          id: employee.id,
          name: employee.name,
          surName: employee.surName,
          position: employee.position,
          experienceYears: employee.experienceYears,
          about: {
            az: employee.about_az,
            ru: employee.about_ru,
            en: employee.about_en,
          },
          imageUrl: employee.imageUrl,
          medical: employee.medical ? {
              id: employee.medical.id,
              name: employee.medical.name,
              iconUrl: employee.medical.iconUrl
          } : null,
          schedule: await this.getSchedule(employee.id),
          services: employee.employeeCategories.map((item: any) => {
              return {
                  categoryId: item.subCategory.categoryId,
                  subCategoryId: item.subCategoryId,
                  categoryIconUrl: item.subCategory.category.iconUrl,
                  categoryName: item.subCategory.category.name,
                  name: item.subCategory.name,
                  az: item.subCategory.name_az,
                  ru: item.subCategory.name_ru,
                  en: item.subCategory.name_en,
                  price: item.price.toString() + " azn",
              };
          }),
      };
  }

  public async createEmployee(data: any): Promise<any> {
    const {
      name,
      surName,
      type,
      position,
      imageUrl,
      userId,
      medicalId,
      prices,
    } = data;

    const existingEmployeeByUser = await prisma.employee.findFirst({
      where: { userId },
    });

    if (existingEmployeeByUser) {
      throw new Error("Employee for this user is exists");
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        surName,
        type,
        position,
        imageUrl,
        user: { connect: { id: userId } },
        medical: { connect: { id: medicalId } },
      },
    });

    // sync employee-category
    if (prices) {
      await this.syncEmployeeCategories(employee.id, prices);
    }

    return await prisma.employee.findUnique({
      where: { id: employee.id },
      include: {
        employeeCategories: true,
      },
    });
  }

  public async updateEmployee(id: number, data: any): Promise<any> {
    const {
      name,
      surName,
      type,
      position,
      imageUrl,
      userId,
      medicalId,
      prices,
    } = data;

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        surName,
        type,
        position,
        imageUrl,
        user: { connect: { id: userId } },
        medical: { connect: { id: medicalId } },
      },
    });

    // sync employee-category
    if (prices) {
      await this.syncEmployeeCategories(employee.id, prices);
    }

    return await prisma.employee.findUnique({
      where: { id: employee.id },
      include: {
        employeeCategories: true,
      },
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
      where: { employeeId },
    });

    await prisma.employee.delete({
      where: {
        id: employeeId,
      },
    });
  }

  protected async syncEmployeeCategories(
    employeeId: number,
    prices: any,
  ): Promise<any> {
    const inputSubCategories = prices.map((item: any) =>
      Number(item.subCategoryId),
    );

    await prisma.employeeCategory.deleteMany({
      where: {
        employeeId,
        subCategoryId: { notIn: inputSubCategories },
      },
    });

    for (const item of prices) {
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: item.subCategoryId },
      });

      if (!subCategory) {
        continue;
      }

      await prisma.employeeCategory.upsert({
        where: {
          employeeId_subCategoryId: {
            employeeId,
            subCategoryId: Number(item.subCategoryId),
          },
        },
        update: { price: Number(item.price) },
        create: {
          employeeId,
          subCategoryId: Number(item.subCategoryId),
          price: Number(item.price),
        },
      });
    }

    return await prisma.employeeCategory.findMany({
      where: { employeeId },
    });
  }

  protected async getSchedule(employeeId: number): Promise<string> {
    const slots = await prisma.availability.findMany({
        where: {employeeId},
        orderBy: {day: "asc"}
    });

    if (!slots.length) {
        return '';
    }

    const result: string[] = [];
    let rangeStart: any = null;
    let prev: any = null;

    for (const slot of slots) {
        if (!rangeStart) {
            rangeStart = slot;
            prev = slot;
            continue;
        }

        const sameHours =
            slot.startTime === rangeStart.startTime &&
            slot.endTime === rangeStart.endTime;

        if (!sameHours || slot.day !== prev.day + 1) {
            const time = `${formatTime(rangeStart.startTime)}-${formatTime(rangeStart.endTime)}`;
            result.push(
                rangeStart.day === prev.day
                    ? `${daysMap[rangeStart.day]} ${time}`
                    : `${daysMap[rangeStart.day]} - ${daysMap[prev.day]}, ${time}`
            );

            rangeStart = slot;
        }

        prev = slot;
    }

    if (rangeStart) {
        const time = `${formatTime(rangeStart.startTime)}-${formatTime(rangeStart.endTime)}`;
        result.push(
            rangeStart.day === prev.day
                ? `${daysMap[rangeStart.day]} ${time}`
                : `${daysMap[rangeStart.day]} - ${daysMap[prev.day]}, ${time}`
        );
    }

    return result.join(', ');
  }
}
