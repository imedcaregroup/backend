import {AdminRequest, UserRequest} from "index";
import { Response } from "express";
import prisma from "../config/db";
import {sendErrorResponse, sendSuccessResponse} from "../utils/response";
import {EmployeeService} from "../services/employeeService";

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

  const createEmployee = async (req: AdminRequest, res: Response): Promise<any> => {
      const {name, surName, type, position, userId, medicalId, imageUrl} = req.body;

      try {
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

          return sendSuccessResponse({
              res,
              data: {
                  employee,
              },
          });
      } catch (error) {
          return sendErrorResponse({res, error});
      }
  };

  const updateEmployee = async (req: AdminRequest, res: Response): Promise<any> => {
      const employeeId = parseInt(req.params.id as string);
      const {name, surName, type, position, userId, medicalId, imageUrl} = req.body;

      try {
          const employee = await prisma.employee.update({
              where: {
                  id: employeeId
              },
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

          return sendSuccessResponse({
              res,
              data: {
                  employee,
              },
          });
      } catch (error) {
          return sendErrorResponse({res, error});
      }
  };

  const deleteEmployee = async (req: AdminRequest, res: Response): Promise<any> => {
      const employeeId = parseInt(req.params.id as string);

      try {
          const orderExists = await prisma.order.findFirst({
              where: { employeeId },
          });

          if (orderExists) {
              return sendErrorResponse({
                  res,
                  statusCode: 400,
                  error: "Cannot delete this employee cause it used in orders",
              });
          }

          await prisma.employee.delete({
              where: {
                  id: employeeId
              }
          });

          return sendSuccessResponse({ res });
      } catch (error) {
          return sendErrorResponse({res, error});
      }
  };

  const getDoctorsByCategory = async (req: UserRequest, res: Response): Promise<any> => {
      const categoryId = parseInt(req.body.categoryId as string);

      if (!categoryId) {
          return sendErrorResponse({res, error: "You have to pass categoryId", statusCode: 400});
      }

      try {
          const employeeService = new EmployeeService();
          const employees = await employeeService.getDoctorsByCategory(categoryId);

          return sendSuccessResponse({res, data: employees});
      } catch (error) {
          return sendErrorResponse({res, error});
      }
  };

  return {
    getEmployees,
    getDoctorsByCategory,
    createEmployee,
    updateEmployee,
    deleteEmployee
  };
};

export default EmployeeController;
