import { Response } from "express";
import prisma from "../config/db";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest } from "../types";

const CategoryController = () => {
  const getCategories = async (
    req: UserRequest,
    res: Response
  ): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const cursor = parseInt(req.query.cursor as string) || "";
      const serviceId = parseInt(req.query.service as string);

      logHttp("Fetching categories ==> ");
      let categories = await prisma.category.findMany({
        where: {
          serviceId,
        },
        ...(cursor && { cursor: { id: cursor } }),
        ...(cursor && { skip: 1 }),
        take: limit,
        orderBy: {
          name: "asc",
        },
      });

      logHttp("Fetched categories");

      return sendSuccessResponse({
        res,
        data: {
          categories,
          cursor:
            categories.length >= limit
              ? categories[categories.length - 1]["id"]
              : null,
        },
      });
    } catch (error: any) {
      logError(`Error while getCategories ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`Category - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`Category - ${context} => ${JSON.stringify(value)}`);

  return {
    getCategories,
  };
};

export default CategoryController;
