import { Response } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { AdminRequest, UserRequest } from "../types";
import prisma from "../config/db";

const CategoryController = () => {
  const getCategories = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const cursor = parseInt(req.query.cursor as string) || "";
      const serviceId = parseInt(req.query.service as string);

      logHttp("Fetching categories ==> ");
      let categories = await __db.category.findMany({
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

  const createCategory = async (
    req: AdminRequest,
    res: Response,
  ): Promise<any> => {
    const { name, serviceId, iconUrl } = req.body;

    try {
      const category = await prisma.category.create({
        data: {
          iconUrl,
          name,
          serviceId,
        },
      });

      return sendSuccessResponse({
        res,
        data: {
          category,
        },
      });
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const updateCategory = async (
    req: AdminRequest,
    res: Response,
  ): Promise<any> => {
    const categoryId = parseInt(req.params.id);

    const { iconUrl, name, serviceId } = req.body;

    try {
      const category = await prisma.category.update({
        data: {
          iconUrl,
          name,
          serviceId,
        },
        where: {
          id: categoryId,
        },
      });

      return sendSuccessResponse({
        res,
        data: {
          category,
        },
      });
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const deleteCategory = async (
    req: AdminRequest,
    res: Response,
  ): Promise<any> => {
    const categoryId = parseInt(req.params.id);

    if (!categoryId) {
      return sendErrorResponse({
        res,
        error: "Category id is required",
        statusCode: 400,
      });
    }

    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      return sendErrorResponse({
        res,
        error: "Category not found",
        statusCode: 404,
      });
    }

    const orderExists = await prisma.order.findFirst({
      where: { categoryId },
    });

    if (orderExists) {
      return sendErrorResponse({
        res,
        statusCode: 400,
        error: "Cannot delete this category",
      });
    }

    try {
      await prisma.category.delete({
        where: {
          id: categoryId,
        },
      });

      return sendSuccessResponse({ res });
    } catch (error) {
      return sendErrorResponse({
        res,
        statusCode: 500,
        error: "Could not delete category",
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`Category - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`Category - ${context} => ${JSON.stringify(value)}`);

  return {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};

export default CategoryController;
