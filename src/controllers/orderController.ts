import { Response } from "express";
import prisma from "../config/db";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest } from "../types";
import { formatTime } from "../utils/helpers";

const OrderController = () => {
  const createOrder = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      logHttp("Checking for  service,category,subCategOry and medical ==> ");

      const { serviceId, categoryId, subCategoryId, medicalId } = req.body;
      const [service, category, subCategory, medical, medicalCategory] =
        await Promise.all([
          prisma.service.findFirst({
            where: {
              id: +serviceId,
            },
            select: {
              id: true,
            },
          }),
          prisma.category.findFirst({
            where: {
              id: +categoryId,
            },
            select: {
              id: true,
            },
          }),
          prisma.subCategory.findFirst({
            where: {
              id: +subCategoryId,
            },
            select: {
              categoryId: true,
            },
          }),
          prisma.medical.findFirst({
            where: {
              id: +medicalId,
            },
            select: {
              id: true,
            },
          }),
          prisma.medicalCategory.findFirst({
            where: {
              medicalId,
              subCategoryId,
            },
            select: {
              id: true,
              price: true,
            },
          }),
        ]);

      if (!service) throw new Error("No service found");

      if (!category) throw new Error("No category found");

      if (!subCategory) throw new Error("No subCategory found");

      if (!medical) throw new Error("No medical found");

      if (!medicalCategory) throw new Error("No medical category found");

      const formatedTime = formatTime(+req.body.startTime);

      logHttp("Checked for  service,category,subCategiry and medical ==> ");

      logHttp("Creating order ==> ");
      const order = await prisma.order.create({
        data: {
          ...req.body,
          price: medicalCategory.price,
          userId: req.user._id,
          orderDate: new Date(`${req.body.date} ${formatedTime}`),
        },
      });
      logHttp("Created order ==> ");

      return sendSuccessResponse({
        res,
        message: "Order created successfully!!!",
        data: {
          ...order,
        },
      });
    } catch (error: any) {
      logError(`Error while createOrder ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };

  const getMyOrders = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const cursor = parseInt(req.query.cursor as string) || "";
      const select = {
        id: true,
        name: true,
        iconUrl: true,
      };

      logHttp("Fetching orders ==> ");
      let orders = await prisma.order.findMany({
        where: {
          userId: req.user._id,
        },
        ...(cursor && { cursor: { id: cursor } }),
        ...(cursor && { skip: 1 }),
        take: limit,
        include: {
          service: {
            select,
          },
          category: {
            select,
          },
          subCategory: {
            select,
          },
          medical: {
            select,
          },
        },
        orderBy: {
          orderDate: "desc",
        },
      });

      logHttp("Fetched orders");

      return sendSuccessResponse({
        res,
        data: {
          orders,
          cursor:
            orders.length >= limit ? orders[orders.length - 1]["id"] : null,
        },
      });
    } catch (error: any) {
      logError(`Error while getMyOrder ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };

  const acceptOrRejeectOrder = async (
    req: UserRequest,
    res: Response
  ): Promise<any> => {
    try {
      const orderId = +req.params.id;

      logHttp("Checking for order in db");
      const order = await prisma.order.findFirst({
        where: {
          id: +orderId,
        },
        select: {
          id: true,
        },
      });

      if (!order) throw new Error("No order found");

      logHttp("Checked for order in db");

      logHttp("Accepting or rejecting order ==> ");
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          ...req.body,
        },
      });

      logHttp("Accepted or rejected order ==> ");

      return sendSuccessResponse({
        res,
        message: "Sucess!!!",
      });
    } catch (error: any) {
      logError(`Error while acceptOrRejeectOrder ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };

  const getOrders = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const page = parseInt(req.query.page as string) || 1;
      const orderStatus = req.query.orderStatus;
      const from = req.query.from;
      const to = req.query.to;
      const select = {
        id: true,
        name: true,
        iconUrl: true,
      };

      const condition: { [key: string]: any } = {};
      if (orderStatus) condition["orderStatus"] = orderStatus;

      //
      if (from && to) {
        const startDate = new Date(`${from}T00:00:00.000Z`); // Start date
        const endDate = new Date(`${to}T23:59:59.999Z`);
        condition["orderDate"] = {
          gte: startDate, // Greater than or equal to start date
          lte: endDate, // Less than or equal to end date
        };
      }

      logHttp("Counting orders");
      const count = await prisma.order.count({
        where: condition,
      });

      logHttp("Counted orders");

      logHttp("Fetching orders ==> ");
      let orders = await prisma.order.findMany({
        where: condition,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          service: {
            select,
          },
          category: {
            select,
          },
          subCategory: {
            select,
          },
          medical: {
            select,
          },
        },
        orderBy: {
          orderDate: "desc",
        },
      });

      logHttp("Fetched orders");

      return sendSuccessResponse({
        res,
        data: {
          orders,
          meta: {
            count,
            limit: +limit,
            page: +page,
          },
        },
      });
    } catch (error: any) {
      logError(`Error while getMyOrder ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };

  const getOrder = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const orderId = Number(req.params.id);
      const select = {
        id: true,
        name: true,
        iconUrl: true,
      };

      logHttp("Fetching order");
      let order = await prisma.order.findFirst({
        where: {
          id: orderId,
        },
        include: {
          service: {
            select,
          },
          category: {
            select,
          },
          subCategory: {
            select,
          },
          medical: {
            select,
          },
          user: {
            select: {
              name: true,
              dob: true,
              mobileNumber: true,
              email: true,
            },
          },
        },
      });

      logHttp("Fetched order");

      if (!order) throw new Error("No order found");

      return sendSuccessResponse({
        res,
        data: {
          ...order,
        },
      });
    } catch (error: any) {
      logError(`Error while getOrder ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`Order - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`Order - ${context} => ${JSON.stringify(value)}`);

  return {
    createOrder,
    getMyOrders,
    acceptOrRejeectOrder,
    getOrders,
    getOrder,
  };
};

export default OrderController;
