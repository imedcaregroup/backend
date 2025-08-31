import { Response } from "express";
import { AdminRequest, UserRequest } from "../types";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";

const NotificationsController = () => {
  const getNotifications = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const notifications = await __db.userNotification.findMany({
        where: {
          userId: req.user?._id,
        },
        include: {
          notification: {
            select: {
              title: true,
              body: true,
            },
          },
        },
        orderBy: { notification: { createdAt: "desc" } },
      });

      logHttp("Fetched notifications");

      return sendSuccessResponse({
        res,
        data: {
          notifications,
        },
      });
    } catch (error: any) {
      logError(`Error while getNotifications ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const readNotification = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const { notificationId } = req.params;
      const notification = await __db.userNotification.updateMany({
        where: {
          userId: req.user?._id,
          notificationId: Number(notificationId),
        },
        data: {
          readAt: new Date(),
        },
      });
      logHttp("Marked notification as read", notification);
      return sendSuccessResponse({
        res,
        data: {
          notification,
        },
      });
    } catch (error: any) {
      logError(`Error while readNotification ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const createNotification = async (
    req: AdminRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const { title, body } = req.body;

      const notification = await __db.notification.create({
        data: {
          title,
          body,
        },
      });

      const users = await __db.user.findMany({
        where: { isDeleted: false },
        select: { id: true },
      });

      const BATCH = 1000;
      for (let i = 0; i < users.length; i += BATCH) {
        await __db.userNotification.createMany({
          data: users.slice(i, i + BATCH).map((u) => ({
            userId: u.id,
            notificationId: notification.id,
          })),
          skipDuplicates: true,
        });
      }

      logHttp("Created notification", notification);
      return sendSuccessResponse({
        res,
        data: {
          notification,
        },
      });
    } catch (error: any) {
      logError(`Error while createNotification ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`SpecialOffer - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`SpecialOffer - ${context} => ${JSON.stringify(value)}`);

  return {
    getNotifications,
    createNotification,
    readNotification,
  };
};

export default NotificationsController;
