import { Response } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest } from "../types";

const SubCategoryController = () => {
  const getSubCategories = async (
    req: UserRequest,
    res: Response
  ): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const cursor = parseInt(req.query.cursor as string) || "";
      const categoryId = parseInt(req.query.category as string);
      const searchText = req.query.searchText || "";

      logHttp("Fetching subCategories ==> ");
      let subCategories = await __db.subCategory.findMany({
        where: {
          ...(categoryId && { categoryId }),
          ...(searchText && {
            name: { contains: searchText as string, mode: "insensitive" },
          }),
        },
        ...(cursor && { cursor: { id: cursor } }),
        ...(cursor && { skip: 1 }),
        take: limit,
        orderBy: {
          name: "asc",
        },
        include: {
          category: {
            select: {
              name: true, // Include category name
              serviceId: true, // Include serviceId
              service: {
                select: {
                  name: true, // Include service name
                },
              },
            },
          },
        },
      });

      logHttp("Fetched subCategories");

      return sendSuccessResponse({
        res,
        data: {
          subCategories: subCategories.map((obj: any) => ({
            id: obj.id,
            iconUrl: obj.iconUrl,
            name: obj.name,
            categoryId: obj.categoryId,
            categoryName: obj.category?.name,
            serviceId: obj.category?.serviceId,
            serviceName: obj.category.service?.name,
          })),
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
