import { UserRequest } from "index";
import { Response } from "express";
import prisma from "../config/db";
import { sendSuccessResponse } from "../utils/response";

const EmployeeController = () => {
  const getEmployees = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    const medicalId = parseInt(req.query.medicalId as string) || null;

    let condition = {};
    if (medicalId) {
      condition = {
        where: { medicalId },
      };
    }

    let employees = await prisma.employee.findMany(condition);

    return sendSuccessResponse({
      res,
      data: {
        employees,
      },
    });
  };

  return {
    getEmployees,
  };
};

export default EmployeeController;
