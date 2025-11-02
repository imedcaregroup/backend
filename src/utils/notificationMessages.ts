export type NotificationLanguage = "az" | "en" | "ru";

interface NotificationMessage {
  az: { title: string; body: string };
  en: { title: string; body: string };
  ru: { title: string; body: string };
}

export const NOTIFICATION_MESSAGES = {
  ORDER_COMPLETED: {
    az: {
      title: "Sifariş tamamlandı",
      body: "Sifarişiniz uğurla tamamlandı.",
    },
    en: {
      title: "Order Completed",
      body: "Your order has been completed successfully.",
    },
    ru: {
      title: "Заказ завершен",
      body: "Ваш заказ успешно завершен.",
    },
  },
  ORDER_ON_THE_WAY: {
    az: {
      title: "Sifariş yoldadır",
      body: "Sifarişiniz indi çatdırılır.",
    },
    en: {
      title: "Order on the way",
      body: "Your order is being delivered now.",
    },
    ru: {
      title: "Заказ в пути",
      body: "Ваш заказ доставляется.",
    },
  },
  ORDER_ACCEPTED: {
    az: {
      title: "Sifarişiniz qəbul edildi",
      body: "Sifarişiniz admin tərəfindən qəbul edildi.",
    },
    en: {
      title: "Your order has been accepted",
      body: "Your order has been accepted by admin.",
    },
    ru: {
      title: "Ваш заказ принят",
      body: "Ваш заказ принят администратором.",
    },
  },
  ORDER_REJECTED: {
    az: {
      title: "Sifarişiniz rədd edildi",
      body: "Sifarişiniz admin tərəfindən rədd edildi.",
    },
    en: {
      title: "Your order has been rejected",
      body: "Your order has been rejected by admin.",
    },
    ru: {
      title: "Ваш заказ отклонен",
      body: "Ваш заказ отклонен администратором.",
    },
  },
} as const;

/**
 * Get notification message in specified language
 * @param messageKey - Key from NOTIFICATION_MESSAGES
 * @param language - Language code (az, en, ru). Defaults to 'az'
 * @returns Notification title and body in the specified language
 */
export const getNotificationMessage = (
  messageKey: keyof typeof NOTIFICATION_MESSAGES,
  language: NotificationLanguage = "az",
): { title: string; body: string } => {
  return NOTIFICATION_MESSAGES[messageKey][language];
};

/**
 * Get custom rejection message with optional custom reason
 * @param customReason - Custom rejection reason (optional)
 * @param language - Language code (az, en, ru). Defaults to 'az'
 * @returns Notification title and body
 */
export const getOrderRejectionMessage = (
  customReason?: string,
  language: NotificationLanguage = "az",
): { title: string; body: string } => {
  const message = NOTIFICATION_MESSAGES.ORDER_REJECTED[language];

  return {
    title: message.title,
    body: customReason || message.body,
  };
};