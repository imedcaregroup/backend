import dotenv from "dotenv";
dotenv.config();
import {UserRequest} from "index";
import {Response} from "express";
import {sendErrorResponse, sendSuccessResponse} from "../utils/response";


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
                callbackUrl: 'https://api.caregroup.tech/api/v1/payriff-callback',
                cardSave: false,
                operation: 'PURCHASE',
                metadata: { orderId: '123123' },
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

            console.log(`Payment callback received for order ${orderId}`);
            console.log(`Payment status: ${status}`);
            console.log(`Metadata:`, metadata);
            console.log(req.body);

            // db

            return sendSuccessResponse({
                res,
                data: {
                    message: 'Callback processed successfully',
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