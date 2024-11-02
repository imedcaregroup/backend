import { Response } from "express";
import prisma from "../config/db";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest } from "../types";

const SubCategoryController = () => {
  const getSubCategories = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const cursor = parseInt(req.query.cursor as string) || "";
      const categoryId = parseInt(req.query.category as string);

      logHttp("Fetching subCategories ==> ");
      let subCategories = await prisma.subCategory.findMany({
        where: {
          categoryId,
        },
        ...(cursor && { cursor: { id: cursor } }),
        ...(cursor && { skip: 1 }),
        take: limit,
        orderBy: {
          name: "asc",
        },
      });

      logHttp("Fetched subCategories");

      return sendSuccessResponse({
        res,
        data: {
          subCategories,
          cursor:
            subCategories.length >= limit
              ? subCategories[subCategories.length - 1]["id"]
              : null,
        },
      });
    } catch (error: any) {
      logError(`Error while getSubCategories ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`SubCategory - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`SubCategory - ${context} => ${JSON.stringify(value)}`);

  return {
    getSubCategories,
  };
};

export default SubCategoryController;
