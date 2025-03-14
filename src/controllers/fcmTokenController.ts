import { Response } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest } from "../types";

const FcmTokenController = () => {
  const setFcmToken = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      logHttp("Finding Token With Given Fcm Token");
      const token = await __db.fcmToken.findFirst({
        where: {
          token: req.body.token,
        },
      });

      if (token) throw new Error("Token already in use");
      logHttp("No Fcm Token With Given Fcm Token");

      logHttp("Creating Fcm Token For User");
      await __db.fcmToken.create({
        data: {
          ...req.body,
          userId: req.user._id,
        },
      });
      logHttp("Created Fcm Token For User");

      return sendSuccessResponse({
        res,
        message: "Created token successfully!!!",
      });
    } catch (error: any) {
      logError(`Error while setFcmToken ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const deleteFcmToken = async (
    req: UserRequest,
    res: Response
  ): Promise<any> => {
    try {
      logHttp("Deleting Token");
      await __db.fcmToken.delete({
        where: {
          token: req.body.token,
          userId: req.user._id,
        },
      });
      logHttp("Deleted Token");

      return sendSuccessResponse({
        res,
        message: "Deleted token successfully!!!",
      });
    } catch (error: any) {
      logError(`Error while deleteFcmToken ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };
  const logHttp = (context: string, value?: any) =>
    logger.http(`FcmToken - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`FcmToken - ${context} => ${JSON.stringify(value)}`);

  return {
    setFcmToken,
    deleteFcmToken,
  };
};

export default FcmTokenController;
