import { Response } from "express";
import prisma from "../config/db";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest } from "../types";
import { formatTime } from "../utils/helpers";

const AvailabilityController = () => {
  const getAvailableDays = async (
    req: UserRequest,
    res: Response
  ): Promise<any> => {
    try {
      const medicalId = parseInt(req.query.medicalId as string);

      logHttp("Fetching categories ==> ");
      let days = await prisma.availability.findMany({
        where: {
          medicalId,
        },
        distinct: ["day"],
        select: {
          day: true,
        },
        orderBy: {
          day: "asc",
        },
      });

      logHttp("Fetched days");

      return sendSuccessResponse({
        res,
        data: {
          days,
        },
      });
    } catch (error: any) {
      logError(`Error while getAvailableDays ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const getTimeSlots = async (
    req: UserRequest,
    res: Response
  ): Promise<any> => {
    try {
      const date = req.query.date;
      const medicalId = parseInt(req.query.medicalId as string);
      const day = parseInt(req.query.day as string);

      logHttp("Fetching timeSlots ==> ");
      const [medical, availableDays, timeSlots] = await Promise.all([
        prisma.medical.findFirst({
          where: {
            id: medicalId,
          },
          select: {
            id: true,
          },
        }),
        prisma.availability.findFirst({
          where: {
            day,
          },
          select: {
            id: true,
          },
        }),
        prisma.availability.findMany({
          where: {
            day,
            medicalId,
          },
          select: {
            id: true,
            startTime: true,
          },
          orderBy: {
            startTime: "asc",
          },
        }),
      ]);

      if (!medical) throw new Error("No medical found");

      if (!availableDays) throw new Error("No day found");

      if (!timeSlots || !timeSlots.length)
        throw new Error("No time slots found");

      logHttp("Fetched timeSlots");

      const orders = await prisma.order.findMany({
        where: {
          date: date as string,
          medicalId,
          OR: [{ orderStatus: "pending" }, { orderStatus: "accepted" }],
        },
        select: {
          startTime: true,
        },
      });

      const availableTimeslots = timeSlots.filter(
        (slot) => !orders.some((order) => order.startTime === slot.startTime)
      );

      return sendSuccessResponse({
        res,
        data: {
          availableTimeslots: availableTimeslots?.map(
            (availableTimeObj: any) => ({
              ...availableTimeObj,
              displayTime: formatTime(availableTimeObj.startTime).slice(0, -3),
            })
          ),
        },
      });
    } catch (error: any) {
      logError(`Error while getTimeSlots ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`Availability - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`Availability - ${context} => ${JSON.stringify(value)}`);

  return {
    getAvailableDays,
    getTimeSlots,
  };
};

export default AvailabilityController;
