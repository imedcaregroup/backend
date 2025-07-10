import dotenv from "dotenv";
dotenv.config();
import {Payriff, UserRequest} from "../types/index";
import {Response} from "express";
import {sendErrorResponse, sendSuccessResponse} from "../utils/response";
import prisma from "../config/db";
import {EmailJsService} from "../services/emailJsService";

const PaymentController = () => {
    const getHeaders = () => {
        return {
            'Content-Type': 'application/json',
            Authorization: process.env.PAYRIFF_API_KEY || '',
        };
    };
    const makePayment = async (
        req: UserRequest,
        res: Response
    ): Promise<any> => {
        try {

            const orderId = 1;

            const body = {
                amount: req.body.amount,
                language: 'AZ',
                currency: 'AZN',
                description: 'Order Payment',
                callbackUrl: 'https://api.caregroup.tech/api/v1/payriff-callback',
                cardSave: false,
                operation: 'PURCHASE',
                metadata: { orderId },
            };

            const response = await fetch(Payriff.BASE_URL + `/orders`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(body),
            });

            const data = await response.json();

            // if (data.status === '00000') {
                await prisma.order.update({
                    data: {
                        payment_order_id: data.payload.orderId
                    },
                    where: {
                        id: orderId
                    }
                });
            // }

            return sendSuccessResponse({
                res,
                data: {
                    data
                },
            });
        } catch (error: any) {

            return sendErrorResponse({
                res,
                statusCode: error?.statusCode || 400,
                error,
            });
        }
    };


    const callbackPayment = async (req: UserRequest, res: Response): Promise<any> => {
        try {
            const { code, payload } = req.body;

            const paymentOrderId = payload.orderId || null;
            if (!paymentOrderId) {
                return sendErrorResponse({
                    res,
                    statusCode: 400,
                    error: "Invalid order id"
                });
            }

            // db
            let order = await prisma.order.findFirst({
                where: {
                    paymetStatus: 'pending',
                    payment_order_id: paymentOrderId
                },
                include: {
                    user: true
                }
            });

            if (!order) {
                return sendErrorResponse({
                    res,
                    statusCode: 404,
                    error: "Order not found"
                });
            }

            const response = await fetch(Payriff.BASE_URL + '/orders/' + paymentOrderId, {
                headers: getHeaders()
            });
            const data = await response.json();

            if (data.code != Payriff.SUCCESS) {
                return sendErrorResponse({
                        res,
                        statusCode: 404,
                        error: "Payment order not found"
                    });
            }

            const paymentIsSuccessful = (code === Payriff.SUCCESS);

            try {
                await __db.order.update({
                    data: {
                        paymetStatus: paymentIsSuccessful ? 'success' : 'failed'
                    },
                    where: {id: order.id},
                });

                const mailService = new EmailJsService();
                await mailService.sendMessage(
                    order.user.email as string,
                    'payment_successful',
                    {name: order.user.name as string}
                );
            } catch (error) {
                return sendErrorResponse({
                    res,
                    statusCode: 500,
                    error
                });
            }

            return sendSuccessResponse({
                res,
                data: {
                    message: paymentIsSuccessful ? 'Payment completed successfully' : 'There is an error on payment',
                },
            });
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
        callbackPayment
    }
};


export default PaymentController;