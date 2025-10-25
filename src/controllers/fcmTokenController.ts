import { Response } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest } from "../types";

const FcmTokenController = () => {
  const setFcmToken = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      logHttp("Finding Token With Given Fcm Token");
      const existingToken = await __db.fcmToken.findFirst({
        where: {
          token: req.body.token,
        },
      });

      // If token already exists for this user, return success (idempotent)
      if (existingToken && existingToken.userId === req.user._id) {
        logHttp("Token already exists for this user, skipping creation");
        return sendSuccessResponse({
          res,
          message: "Token already registered",
        });
      }

      // If token exists for a different user, delete old entry and create new one
      // (FCM tokens are device-specific, they can only belong to one user)
      // We delete instead of update to prevent race conditions where notifications
      // meant for the old user get delivered to the new user's device
      if (existingToken && existingToken.userId !== req.user._id) {
        logHttp(`Token exists for different user (userId: ${existingToken.userId}), deleting old entry and creating new one for current user (userId: ${req.user._id})`);

        // Delete old token entry
        await __db.fcmToken.delete({
          where: {
            id: existingToken.id,
          },
        });
        logHttp("Deleted old Fcm Token entry");

        // Create new token entry for current user
        await __db.fcmToken.create({
          data: {
            ...req.body,
            userId: req.user._id,
          },
        });
        logHttp("Created new Fcm Token for current user");

        return sendSuccessResponse({
          res,
          message: "Token reassigned successfully",
        });
      }

      // Token doesn't exist, create new one
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
    res: Response,
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
