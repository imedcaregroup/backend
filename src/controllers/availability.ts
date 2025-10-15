import { Response, Request } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest } from "../types";

const AvailabilityController = () => {
  const getAvailableDays = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const medicalId = parseInt(req.query.medicalId as string);

      logHttp("Fetching categories ==> ");
      let days = await __db.availability.findMany({
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
    res: Response,
  ): Promise<any> => {
    try {
      const date = req.query.date;
      const medicalId = parseInt(req.query.medicalId as string);
      const day = parseInt(req.query.day as string);

      logHttp("Fetching timeSlots ==> ");
      const [medical, availableDays, timeSlots] = await Promise.all([
        __db.medical.findFirst({
          where: {
            id: medicalId,
          },
          select: {
            id: true,
          },
        }),
        __db.availability.findFirst({
          where: {
            day,
          },
          select: {
            id: true,
          },
        }),
        __db.availability.findMany({
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

      const orders = await __db.order.findMany({
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
        (slot: any) =>
          !orders.some((order: any) => order.startTime === slot.startTime),
      );

      return sendSuccessResponse({
        res,
        data: {
          availableTimeslots: availableTimeslots?.map(
            (availableTimeObj: any) => ({
              ...availableTimeObj,
              displayTime: formatTime(availableTimeObj.startTime).slice(0, -3),
            }),
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

  const getMonths = (req: Request, res: Response) => {
    const months = [];
    const today = new Date();

    for (let i = 0; i < 5; i++) {
      const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push({
        month: futureDate.toLocaleString("default", { month: "long" }), // Get month name
        year: futureDate.getFullYear(),
      });
    }

    res.status(200).json({
      message: "Success",
      status: true,
      data: months,
    });
  };

  // const getRemainingDaysAndSlots = async (
  //   req: Request,
  //   res: Response
  // ): Promise<any> => {
  //   try {
  //     const today = new Date();
  //     const currentDay = today.getDate();
  //     const currentMonth = today.getMonth() + 1;
  //     const currentYear = today.getFullYear();

  //     // Get month and year from the query (defaults to current month and year if not provided)
  //     const month = parseInt(req.query.month as string) || currentMonth;
  //     const year = parseInt(req.query.year as string) || currentYear;

  //     // Get the last day of the requested month
  //     const lastDayOfMonth = new Date(year, month, 0).getDate();

  //     // Format the start and end of the month as strings
  //     const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  //     const endDate = `${year}-${month.toString().padStart(2, "0")}-${lastDayOfMonth}`;

  //     // Fetch available slots for the entire month upfront
  //     const availableSlots = await __db.availability.findMany({
  //       where: {
  //         medicalId: parseInt(req.query.medicalId as string),
  //         day: { in: Array.from({ length: 7 }, (_, i) => i) },
  //       },
  //       select: {
  //         id: true,
  //         day: true,
  //         startTime: true,
  //       },
  //     });

  //     // Fetch all orders for the month to check booked slots
  //     const orders = await __db.order.findMany({
  //       where: {
  //         medicalId: parseInt(req.query.medicalId as string),
  //         date: {
  //           gte: startDate,
  //           lte: endDate,
  //         },
  //         OR: [{ orderStatus: "pending" }, { orderStatus: "accepted" }],
  //       },
  //       select: {
  //         date: true,
  //         startTime: true,
  //       },
  //     });

  //     // Group orders by date for easy comparison
  //     const groupedOrders: { [key: string]: number[] } = {};
  //     orders.forEach((order: any) => {
  //       const orderDate = order.date
  //         ? new Date(order.date).toISOString().split("T")[0]
  //         : null;
  //       if (orderDate && order.startTime !== null) {
  //         if (!groupedOrders[orderDate]) {
  //           groupedOrders[orderDate] = [];
  //         }
  //         groupedOrders[orderDate].push(Number(order.startTime));
  //       }
  //     });

  //     // Calculate the remaining slots for each day of the month
  //     const remainingDays = [];

  //     for (let day = 1; day <= lastDayOfMonth; day++) {
  //       if (month === currentMonth && year === currentYear && day < currentDay) {
  //         continue;
  //       }

  //       const date = new Date(year, month - 1, day);
  //       const dateString = date.toLocaleDateString("en-CA");

  //       // Filter available slots for this specific date
  //       let availableSlotsForDate = availableSlots.filter((slot: any) => {
  //         const slotDay = date.getDay();
  //         return slot.day === slotDay;
  //       });

  //       if (month === currentMonth && year === currentYear && day === currentDay) {
  //         const now = new Date();
  //         const currentTime = now.getHours() * 100 + now.getMinutes();
  //         availableSlotsForDate = availableSlotsForDate.filter((slot: any) => {
  //           return slot.startTime > currentTime;
  //         });
  //       }

  //       const bookedSlots = groupedOrders[dateString] || [];

  //       const remainingSlots = availableSlotsForDate.filter(
  //         (slot: any) => !bookedSlots.includes(Number(slot.startTime))
  //       );

  //       remainingDays.push({
  //         day: date.toLocaleString("default", { weekday: "long" }),
  //         date: dateString,
  //         remainingSlotsCount: remainingSlots.length,
  //         remainingSlots: remainingSlots.map((slot: any) => ({
  //           startTime: slot.startTime,
  //           displayTime: formatTime(slot.startTime),
  //         })),
  //       });
  //     }

  //     return sendSuccessResponse({
  //       res,
  //       data: { remainingDays },
  //     });
  //   } catch (error: any) {
  //     logError(`Error while getRemainingDaysAndSlots ==> `, error?.message);
  //     return sendErrorResponse({
  //       res,
  //       statusCode: error?.statusCode || 400,
  //       error,
  //     });
  //   }
  // };

  const getRemainingDaysAndSlots = async (
    req: Request,
    res: Response,
  ): Promise<any> => {
    try {
      const today = new Date();

      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const month = parseInt(req.query.month as string) || currentMonth;
      const year = parseInt(req.query.year as string) || currentYear;
      const medicalId = parseInt(req.query.medicalId as string);
      const employeeId = parseInt(req.query.employeeId as string) || null;

      const lastDayOfMonth = new Date(year, month, 0).getDate();

      if (!medicalId && !employeeId) {
        return sendErrorResponse({
          res,
          error:
            "You should pass one of the following cases: medicalId or employeeId with medicalId",
          statusCode: 400,
        });
      }

      const orderWhereParts: any = {};
      const availabilityWhereParts: any = {};

      if (medicalId && employeeId) {
        orderWhereParts.medicalId = availabilityWhereParts.medicalId = medicalId;
        orderWhereParts.employeeId = availabilityWhereParts.employeeId = employeeId;
      } else {
        if (medicalId) {
          orderWhereParts.medicalId = medicalId;
          orderWhereParts.employeeId = null;
          availabilityWhereParts.medicalId = medicalId;
          availabilityWhereParts.employeeId = null;
        } else if (employeeId) {
          orderWhereParts.employeeId = employeeId;
          availabilityWhereParts.employeeId = employeeId;
          availabilityWhereParts.medicalId = null;
        }
      }

      // Fetch booked slots more precisely (All orders in given month)
      const orders = await __db.order.findMany({
        where: {
          ...orderWhereParts,
          orderDate: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month - 1, lastDayOfMonth),
          },
          OR: [{ orderStatus: "pending" }, { orderStatus: "accepted" }],
        },
        select: {
          orderDate: true,
          startTime: true,
        },
      });

      // Group booked slots by date
      const bookedSlotsByDate: { [key: string]: { [key: string]: number } } =
        {};
      orders.forEach((order) => {
        const dateKey = toIsoPreservingLocal(order.orderDate).split("T")[0];
        if (!bookedSlotsByDate[dateKey]) {
          bookedSlotsByDate[dateKey] = {};
        }

        if (!bookedSlotsByDate[dateKey][String(order.startTime)]) {
          bookedSlotsByDate[dateKey][String(order.startTime)] = 0;
        }

        bookedSlotsByDate[dateKey][String(order.startTime)]++;
      });

      // Fetch available slots
      const availableSlots = await __db.availability.findMany({
        where: {
          ...availabilityWhereParts,
          day: { in: Array.from({ length: 7 }, (_, i) => i) },
        },
        select: {
          id: true,
          day: true,
          startTime: true,
        },
        orderBy: {
          startTime: "asc",
        },
      });

      const remainingDays = [];

      for (let day = currentDay; day <= lastDayOfMonth; day++) {
        const date = new Date(year, month - 1, day, 0, 0, 0);
        const dateString = toIsoPreservingLocal(date).split("T")[0];
        const slotDay = date.getDay() - 1 < 0 ? 6 : date.getDay() - 1;

        // Filter slots for this day of week
        const availableSlotsForDate = availableSlots.filter(
          (slot) => slot.day === slotDay,
        );

        // Remove booked slots
        const bookedSlotsOnDate = bookedSlotsByDate[dateString];

        const distinctAvailableSlotsForDate = distinctByStartTime(
          availableSlotsForDate,
        );

        const remainingSlots = distinctAvailableSlotsForDate.filter(
          (slot) =>
            !bookedSlotsOnDate?.[String(slot.startTime)] ||
            (bookedSlotsOnDate?.[String(slot.startTime)] &&
              bookedSlotsOnDate?.[String(slot.startTime)] >=
                availableSlotsForDate.filter(
                  (availableSlot) => availableSlot.startTime === slot.startTime,
                ).length),
        );

        // Current-day additional filtering
        const filteredSlots =
          month === currentMonth && year === currentYear && day === currentDay
            ? remainingSlots.filter((slot) => {
                const now = new Date();
                const currentTime = now.getHours() * 100 + now.getMinutes();
                return slot.startTime > currentTime;
              })
            : remainingSlots;

        remainingDays.push({
          day: date.toLocaleString("default", { weekday: "long" }),
          date: dateString,
          remainingSlotsCount: filteredSlots.length,
          remainingSlots: filteredSlots
            .map((slot) => ({
              remainingPlaces:
                availableSlotsForDate.filter(
                  (availableSlot) => availableSlot.startTime === slot.startTime,
                ).length - (bookedSlotsOnDate?.[String(slot.startTime)] || 0),
              startTime: slot.startTime,
              displayTime: formatTime(slot.startTime),
            }))
            .filter((slot) => slot.remainingPlaces > 0),
        });
      }

      return sendSuccessResponse({
        res,
        data: { remainingDays },
      });
    } catch (error: any) {
      console.log(error);
      logError(`Error in getRemainingDaysAndSlots`, error.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };
  // Utility function to format time as 'HH:MM AM/PM'
  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 100);
    const minutes = time % 100;
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
  };

  // Utility function to format time as 'HH:MM AM/PM'
  const distinctByStartTime = <T extends { startTime: number }>(
    arr: T[],
  ): T[] => {
    return Array.from(
      new Map(arr.map((item) => [item.startTime, item])).values(),
    );
  };

  const toIsoPreservingLocal = (d: Date) => {
    const utcTs = Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds(),
    );

    return new Date(utcTs).toISOString();
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`Availability - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`Availability - ${context} => ${JSON.stringify(value)}`);

  return {
    getAvailableDays,
    getTimeSlots,
    getMonths,
    getRemainingDaysAndSlots,
  };
};

export default AvailabilityController;
