import {OrderException} from "../utils/exception";
import {sendPostNotifications} from "../utils/helpers";

 export class OrderService {

    public async completeOrder(orderId: number): Promise<void> {
        const order = await __db.order.findUnique({
            where   : { id: orderId },
            include : { user: true },
        });

        if (!order) {
            throw OrderException.orderNotFound();
        }

        if (order.orderStatus !== 'accepted') {
            throw OrderException.cannotBeCompleted();
        }

        try {
            await __db.order.update({
                where : { id: orderId },
                data  : {
                    orderStatus     : "completed",
                    employeeStatus  : "completed",
                },
            });
        } catch (error) {
            throw OrderException.couldNotSave();
        }

        await this.sendPostNotification(order.userId, order.id);
    }

    private async sendPostNotification(userId: number, orderId: number): Promise<void> {
        const tokens = await __db.fcmToken.findMany({
            where  : { userId: userId },
            select : { token: true },
        });
        if (tokens.length) {
            await sendPostNotifications(
                tokens,
                "Order Completed",
                "Your order has been completed successfully.",
                {
                    deepLink: "imedapp://orders/" + orderId
                },
            );
        }
    }

}