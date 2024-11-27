import { Response } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest } from "../types";

const ServiceController = () => {
  const getServices = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const cursor = parseInt(req.query.cursor as string) || "";

      logHttp("Fetching services ==> ");
      let services = await __db.service.findMany({
        ...(cursor && { cursor: { id: cursor } }),
        ...(cursor && { skip: 1 }),
        take: limit,
        orderBy: {
          name: "asc",
        },
      });

      logHttp("Fetched services");

      return sendSuccessResponse({
        res,
        data: {
          services,
          cursor:
            services.length >= limit
              ? services[services.length - 1]["id"]
              : null,
        },
      });
    } catch (error: any) {
      logError(`Error while getServices ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`Service - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`Service - ${context} => ${JSON.stringify(value)}`);

  return {
    getServices,
  };
};

export default ServiceController;
