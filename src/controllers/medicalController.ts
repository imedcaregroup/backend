import { Response } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest } from "../types";
import { getMedicalsBySubcategory as getMedicalsBySubcategoryQuery } from "../queries/medical";

const MedicalController = () => {
  const getMedicalsBySubcategory = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const subCategoryId = parseInt(req.query.subCategoryId as string);
      const sortOrder = (req.query.sortOrder as string) || "ASC";
      const lastMedicalId = parseInt(req.query.lastMedicalId as string) || null;
      const lastPrice = parseInt(req.query.lastPrice as string) || null;

      logHttp("Fetching Medicals ==> ");
      let medicals = await global.__db.$queryRawUnsafe(
        getMedicalsBySubcategoryQuery(
          subCategoryId,
          lastPrice,
          lastMedicalId,
          limit,
          sortOrder,
        ),
      );

      logHttp("Fetched Medicals ==> ");

      return sendSuccessResponse({
        res,
        data: {
          medicals,
        },
      });
    } catch (error: any) {
      logError(`Error while getMedicalsBySubcategory ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`Medical - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`Medical - ${context} => ${JSON.stringify(value)}`);

  return {
    getMedicalsBySubcategory,
  };
};

export default MedicalController;
