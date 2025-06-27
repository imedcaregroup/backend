import {OrderException} from "../utils/exception";
import {sendPostNotifications} from "../utils/helpers";
import {sendSuccessResponse} from "../utils/response";

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

        await this.sendPostNotification(
            order.userId,
            order.id,
            "Order Completed",
            "Your order has been completed successfully."
        );
    }

     public async startOrder(orderId: number) {
         const order = await __db.order.findFirst({
             where: {id: orderId},
             select: {id: true, userId: true},
         });

         if (!order) throw new Error("No order found");

         await __db.order.update({
             where: {id: orderId},
             data: {
                 employeeStatus: "processing",
             },
         });

         await this.sendPostNotification(
             order.userId,
             order.id,
             "Order on the way",
             "Your order is being delivered now."
         );
     }

     private async sendPostNotification(userId: number, orderId: number, title: string, body: string): Promise<void> {
         const tokens = await __db.fcmToken.findMany({
             where  : { userId: userId },
             select : { token: true },
         });
         if (tokens.length) {
             await sendPostNotifications(
                 tokens,
                 title,
                 body,
                 {
                     deepLink: "imedapp://orders/" + orderId
                 },
             );
         }
     }
 }