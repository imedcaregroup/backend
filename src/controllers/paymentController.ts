import dotenv from "dotenv";
dotenv.config();
import {UserRequest} from "index";
import {Response} from "express";
import {sendErrorResponse, sendSuccessResponse} from "../utils/response";
import prisma from "../config/db";


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

            const body = {
                amount: req.body.amount,
                language: 'AZ',
                currency: 'AZN',
                description: 'Order Payment',
                callbackUrl: 'http://127.0.0.1:4000/api/v1/payriff-callback',
                cardSave: false,
                operation: 'PURCHASE',
                metadata: { orderId: '1' },
            };


            const response = await fetch(`https://api.payriff.com/api/v3/orders`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(body),
            });

            const data = await response.json();
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
            const { metadata, status, orderId } = req.body;

            let orderRecordID = parseInt(metadata.orderId as string) || null;
            if (!orderRecordID) {
                return sendErrorResponse({
                    res,
                    statusCode: 400,
                    error: "Invalid order id"
                });
            }

            // db
            let order = await prisma.order.findFirst({
                select: {id: true},
                where: {
                    id: orderRecordID
                }
            });

            if (!order) {
                return sendErrorResponse({
                    res,
                    statusCode: 400,
                    error: "Invalid order"
                });
            }

            const paymentIsSuccessful = (status === "00000");

            try {
                await __db.order.update({
                    data: {
                        paymetStatus: paymentIsSuccessful ? 'success' : 'failed'
                    },
                    where: {id: order.id},
                });
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
                    orderId,
                    status,
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