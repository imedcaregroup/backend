import { Response,Request } from "express";
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
      const subCategoryId = (req.query.subCategoryIds as string)?.split(',').map((id) => parseInt(id));
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

  const getTopMedicalPartners = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      // Fetching all partners
      const topPartners = await global.__db.medical.findMany();
      
      // Iterate through the results to ensure services are in JSON format
      // topPartners.forEach(partner => {
      //   // If the services field is stored as a string, parse it into an array
      //   if (typeof partner.services === 'string') {
      //     try {
      //       partner.services = JSON.parse(partner.services);  // Convert string to JSON array if needed
      //     } catch (e) {
      //       console.error("Error parsing services field:", partner.services, e);
      //       partner.services = []; // In case of error, set services to an empty array
      //     }
      //   }
      // });
  
      return res.status(200).json({
        success: true,
        data: topPartners,
      });
    } catch (error: any) {
      console.error("Error in fetching top partners:", error);
      logError(`Error while fetching top medical partners ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
        error,
      });
    }
  };

  const getAll = async (req: Request, res: Response): Promise<any> => {
    try {
      const medicalPartners = await global.__db.medical.findMany({
        orderBy: {
          name: "asc", // Sorting by name in alphabetical order
        },
      });

      if (!medicalPartners.length) {
        return res.status(404).json({
          success: false,
          message: "No medical partners found",
        });
      }

      return sendSuccessResponse({
        res,
        data: {
          medicalPartners,
        },
      });
    } catch (error) {
      logError(`Error while fetching top medical partners ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
        error,
      });
    }
  };

  const getMedicalById = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
  
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Medical ID is required.",
        });
      }
  
      // Fetch the medical entry by ID
      const medical = await global.__db.medical.findUnique({
        where: {
          id: parseInt(id), // Ensure the ID is parsed to an integer
        },
      });
  
      if (!medical) {
        return res.status(404).json({
          success: false,
          message: "Medical entry not found.",
        });
      }
  
      return res.status(200).json({
        success: true,
        data: medical,
      });
    } catch (error: any) {
      logError(`Error while fetching medical by ID ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
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
    getTopMedicalPartners,
    getAll,
    getMedicalById
  };
};

export default MedicalController;
