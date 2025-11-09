import { OrderException } from "../utils/exception";
import { sendPostNotifications } from "../utils/helpers";
import { EmailJsService } from "./emailJsService";
import { getNotificationMessage } from "../utils/notificationMessages";

export class OrderService {
  public async completeOrder(orderId: number): Promise<void> {
    const order = await __db.order.findFirst({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw OrderException.orderNotFound();
    }

    if (order.orderStatus !== "accepted") {
      throw OrderException.cannotBeCompleted();
    }

    try {
      await __db.order.update({
        where: { id: orderId },
        data: {
          orderStatus: "completed",
          employeeStatus: "completed",
        },
      });
    } catch (error) {
      throw OrderException.couldNotSave();
    }

    const mailService = new EmailJsService();
    await mailService.sendMessage(
      order.user.email as string,
      "order_completed",
      {
        name: order.user.name as string,
        orderId: orderId,
      },
    );

    const notificationMessage = getNotificationMessage("ORDER_COMPLETED", "az");

    const notification = await __db.notification.create({
      data: {
        title: notificationMessage.title,
        body: notificationMessage.body,
      },
    });
    await __db.userNotification.create({
      data: {
        user: { connect: { id: order.userId } },
        notification: { connect: { id: notification.id } },
      },
    });

    await this.sendPostNotification(
      order.userId,
      order.id,
      notificationMessage.title,
      notificationMessage.body,
    );
  }

  public async startOrder(order: any) {
    if (order.employeeStatus != "pending") {
      throw new Error("Order can start only from status 'pending'");
    }

    await __db.order.update({
      where: { id: order.id },
      data: {
        employeeStatus: "processing",
      },
    });

    const notificationMessage = getNotificationMessage(
      "ORDER_ON_THE_WAY",
      "az",
    );

    const notification = await __db.notification.create({
      data: {
        title: notificationMessage.title,
        body: notificationMessage.body,
      },
    });

    await __db.userNotification.create({
      data: {
        user: { connect: { id: order.userId } },
        notification: { connect: { id: notification.id } },
      },
    });

    await this.sendPostNotification(
      order.userId,
      order.id,
      notificationMessage.title,
      notificationMessage.body,
    );
  }

  public async getOrder(id: number): Promise<any> {
    return await __db.order.findFirst({
      where: { id: id },
      select: {
        id: true,
        userId: true,
        employeeId: true,
        employeeStatus: true,
      },
    });
  }

  private async sendPostNotification(
    userId: number,
    orderId: number,
    title: string,
    body: string,
  ): Promise<void> {
    const tokens = await __db.fcmToken.findMany({
      where: { userId: userId },
      select: { token: true },
    });
    if (tokens.length) {
      await sendPostNotifications(tokens, title, body, {
        deepLink: "imedapp://orders/" + orderId,
      });
    }
  }
}
