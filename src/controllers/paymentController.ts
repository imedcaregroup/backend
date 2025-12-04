import dotenv from "dotenv";
dotenv.config();
import { Payriff, UserRequest } from "../types/index";
import { Response } from "express";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { sentryLogger } from "../utils/sentryLogger";
import { getMailTemplate } from "../utils/emailTemplates";
import { sendMail } from "../utils/sendMail";
import dayjs from "dayjs";
import { OrderSubmitMailBody, sendOrderSubmitMails } from "../utils/helpers";

const PaymentController = () => {
  const getHeaders = () => {
    return {
      "Content-Type": "application/json",
      Authorization: process.env.PAYRIFF_API_KEY || "",
    };
  };
  const makePayment = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const orderId = parseInt(req.body.orderId as string);

      if (!orderId) {
        sentryLogger.logException("Invalid order id", req.body, req.user);

        return sendErrorResponse({
          res,
          statusCode: 400,
          error: "You have to pass orderId",
        });
      }

      const order = await __db.order.findFirst({
        select: { id: true },
        where: {
          id: orderId,
          paymetStatus: {
            in: ["pending", "failed"],
          },
        },
      });

      if (!order) {
        sentryLogger.logException(
          "Order not found or payment status is not pending",
          req.body,
          req.user,
        );

        return sendErrorResponse({
          res,
          statusCode: 404,
          error: "Order not found or payment status is not pending",
        });
      }

      const body = {
        amount: req.body.amount,
        language: "AZ",
        currency: "AZN",
        description: "Order Payment",
        callbackUrl:
          "https://api.caregroup.tech/api/v1/payment/payriff-callback",
        cardSave: false,
        operation: "PURCHASE",
        metadata: { orderId: order.id },
      };

      sentryLogger.logMessage("Try to make payment order", body, req.user);

      const response = await fetch(Payriff.BASE_URL + `/orders`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.code === Payriff.SUCCESS) {
        sentryLogger.logMessage("Successful payment request", data, req.user);

        await __db.order.update({
          data: {
            payment_order_id: data.payload.orderId,
            paymetStatus: "pending",
          },
          where: {
            id: order.id,
          },
        });
      } else {
        sentryLogger.logMessage("Unsuccessful payment request", data, req.user);

        return sendErrorResponse({
          res,
          statusCode: 400,
          error: "Unsuccessful payment: " + data.message,
        });
      }

      return sendSuccessResponse({
        res,
        data: data,
      });
    } catch (error: any) {
      sentryLogger.logException(error, req.body, req.user);

      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const callbackPayment = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const { code, payload } = req.body;

      const paymentOrderId = payload?.orderId || null;
      if (!paymentOrderId) {
        sentryLogger.logException("Invalid payment order id", req.body);

        return sendErrorResponse({
          res,
          statusCode: 400,
          error: "Invalid order id",
        });
      }

      // db
      let order = await __db.order.findFirst({
        where: {
          paymetStatus: "pending",
          payment_order_id: paymentOrderId,
        },
        include: {
          user: true,
          medical: true,
          SpecialOffer: true,
        },
      });

      if (!order) {
        sentryLogger.logException(
          "Order not found or payment status is not pending",
          req.body,
        );

        return sendErrorResponse({
          res,
          statusCode: 404,
          error: "Order not found or payment status is not pending",
        });
      }

      // sentryLogger.logMessage("Try to get order information", req.body);

      // const response = await fetch(
      //   Payriff.BASE_URL + "/orders/" + paymentOrderId,
      //   {
      //     headers: getHeaders(),
      //   },
      // );
      // const data = await response.json();
      //
      // if (data.code != Payriff.SUCCESS) {
      //   sentryLogger.logMessage("Payment not found", data);
      //
      //   return sendErrorResponse({
      //     res,
      //     statusCode: 404,
      //     error: "Payment order not found",
      //   });
      // }

      const paymentIsSuccessful = code === Payriff.SUCCESS;

      sentryLogger.logMessage("Payment completed", req.body);

      try {
        await __db.order.update({
          data: {
            paymetStatus: paymentIsSuccessful ? "success" : "failed",
          },
          where: { id: order.id },
        });

        if (paymentIsSuccessful) {
          const mailTemplate = getMailTemplate("PAYMENT_SUCCESSFUL");
          await sendMail({
            to: order.user.email as string,
            subject: mailTemplate.subject,
            html: mailTemplate.body({
              name: (order.user.name as string).trim(),
            }),
          });
        }
      } catch (error) {
        sentryLogger.logException(error, req.body);

        return sendErrorResponse({
          res,
          statusCode: 500,
          error,
        });
      }

      sendSuccessResponse({
        res,
        data: {
          message: paymentIsSuccessful
            ? "Payment completed successfully"
            : "There is an error on payment",
        },
      });

      const mailBody: OrderSubmitMailBody = {
        id: order.id.toString(),
        medical: { name: order.medical?.name || "" },
        price: order.price,
        orderDate: dayjs(order.orderDate).format("YYYY-MM-DD"),
        startTime: order?.startTime || undefined,
        SpecialOffer: order.SpecialOffer
          ? { title_az: order.SpecialOffer.title_az }
          : undefined,
        additionalInfo: order.additionalInfo || undefined,
        forAnotherPerson: order.forAnotherPerson || false,
        user: {
          name: order.user.name || "",
          surname: order.user.surName || "",
          email: order.user.email || "",
        },
      };
      sendOrderSubmitMails(mailBody);
    } catch (error: any) {
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  return {
    makePayment,
    callbackPayment,
  };
};

export default PaymentController;
