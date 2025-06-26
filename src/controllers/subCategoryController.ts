import { Response } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import {AdminRequest, UserRequest} from "../types";
import prisma from "../config/db";

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
            OR: [
              {
                name_en: {
                  contains: searchText as string,
                  mode: "insensitive",
                },
              },
              {
                name_az: {
                  contains: searchText as string,
                  mode: "insensitive",
                },
              },
              {
                name_ru: {
                  contains: searchText as string,
                  mode: "insensitive",
                },
              },
            ],
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
          medicalCategories: {
            select: {price: true},
            orderBy: {price: "asc"}
          }
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
              en: obj.name_en,
              az: obj.name_az,
              ru: obj.name_ru,
              categoryId: obj.categoryId,
              categoryName: obj.category?.name,
              serviceId: obj.category?.serviceId,
              serviceName: obj.category.service?.name,
              price: obj.medicalCategories.map((medCategory: any) => {
                return Math.ceil(medCategory.price)
              }).join('-')
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

  const createSubCategory = async (
      req: AdminRequest,
      res: Response,
  ): Promise<any> => {

    const {
      iconUrl,
      name,
      parentId
    } = req.body;

    try {
      const category = await prisma.subCategory.create({
        data: {
          iconUrl,
          name,
          categoryId: parentId
        }
      });

      return sendSuccessResponse({
        res,
        data: {
          category
        },
      });
    } catch (error) {
      console.error("Error creating sub category:", error);
    }

  };

  const updateSubCategory = async (
      req: AdminRequest,
      res: Response,
  ): Promise<any> => {

    const categoryId = +req.params.id;
    if (!categoryId) {
      return sendErrorResponse({
        res,
        error: "Category ID is required",
        statusCode: 400,
      });
    }

    const category = await prisma.subCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return sendErrorResponse({
        res,
        error: "Category with given ID is not exists",
        statusCode: 400,
      });
    }

    const {
      iconUrl,
      name,
      parentId
    } = req.body;

    try {
      const category = await prisma.subCategory.update({
        data: {
          iconUrl,
          name,
          categoryId: parentId
        },
        where: {
          id: categoryId
        }
      });

      return sendSuccessResponse({
        res,
        data: {
          category
        },
      });
    } catch (error) {
      console.error("Error updating sub category:", error);
    }

  };

  const deleteSubCategory = async (
      req: AdminRequest,
      res: Response,
  ): Promise<any> => {

    const categoryId = +req.params.id;

    if (!categoryId) {
      return sendErrorResponse({
        res,
        error: "Category id is required",
        statusCode: 400,
      });
    }

    const categoryExists = await prisma.subCategory.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      return sendErrorResponse({
        res,
        error: "Sub category not found",
        statusCode: 404,
      });
    }

    try {
      await prisma.subCategory.delete({
        where: {
          id: categoryId
        }
      });

      return sendSuccessResponse({res,});
    } catch (error) {
      return sendErrorResponse({res, statusCode: 500, error: 'Could not delete sub category'});
    }

  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`SubCategory - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`SubCategory - ${context} => ${JSON.stringify(value)}`);

  return {
    getSubCategories,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory
  };
};

export default SubCategoryController;
