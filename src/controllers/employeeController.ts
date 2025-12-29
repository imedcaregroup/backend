import { AdminRequest, UserRequest } from "index";
import { Response } from "express";
import prisma from "../config/db";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { EmployeeService } from "../services/employeeService";

const EmployeeController = () => {
  const getEmployees = async (
    req: AdminRequest,
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

  const createEmployee = async (
    req: AdminRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const employeeService = new EmployeeService();
      const employee = await employeeService.createEmployee(req.body);

      return sendSuccessResponse({
        res,
        data: {
          employee,
        },
      });
    } catch (error) {
      return sendErrorResponse({ res, error });
    }
  };

  const updateEmployee = async (
    req: AdminRequest,
    res: Response,
  ): Promise<any> => {
    const employeeId = parseInt(req.params.id as string);

    try {
      const employeeService = new EmployeeService();
      const employee = await employeeService.updateEmployee(
        employeeId,
        req.body,
      );

      return sendSuccessResponse({
        res,
        data: {
          employee,
        },
      });
    } catch (error) {
      return sendErrorResponse({ res, error });
    }
  };

  const deleteEmployee = async (
    req: AdminRequest,
    res: Response,
  ): Promise<any> => {
    const employeeId = parseInt(req.params.id as string);

    try {
      const employeeService = new EmployeeService();
      await employeeService.deleteEmployee(employeeId);

      return sendSuccessResponse({ res });
    } catch (error) {
      return sendErrorResponse({ res, error });
    }
  };

  const getDoctors = async (req: UserRequest, res: Response): Promise<any> => {
    const categoryId = parseInt(req.query.categoryId as string) || null;

    try {
      const employeeService = new EmployeeService();
      const employees = await employeeService.getDoctors(categoryId);

      return sendSuccessResponse({
        res,
        data: {
          employees,
        },
      });
    } catch (error) {
      return sendErrorResponse({ res, error });
    }
  };

  const getDoctor = async (req: UserRequest, res: Response): Promise<any> => {
    const employeeId = parseInt(req.params.id as string);
    if (!employeeId) {
      return sendErrorResponse({
        res,
        error: "Invalid employee id",
        statusCode: 400,
      });
    }

    try {
      const employeeService = new EmployeeService();
      const doctor = await employeeService.getDoctor(employeeId);

      return sendSuccessResponse({ res, data: doctor });
    } catch (error) {
      return sendErrorResponse({ res, error });
    }
  };

  const getOrders = async (req: UserRequest, res: Response): Promise<void> => {
    const userId = req.user?._id;

    try {
      const employeeService = new EmployeeService();
      const doctor = await employeeService.getDoctorByUserId(userId);
      const doctorOrders = await employeeService.getOrdersByDoctorId(doctor.id);

      return sendSuccessResponse({ res, data: doctorOrders });
    } catch (error) {
      return sendErrorResponse({ res, error });
    }
  };

  return {
    getDoctors,
    getDoctor,
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getOrders,
  };
};

export default EmployeeController;
