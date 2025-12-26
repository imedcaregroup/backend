import { Language } from "index";

export const NOTIFICATION_MESSAGES = {
  ORDER_COMPLETED: {
    az: {
      title: "Sifariş tamamlandı",
      body: "Xidmət uğurla yerinə yetirildi. Təşəkkür edirik!",
    },
    en: {
      title: "Order Completed",
      body: "Service has been successfully provided. Thank you!",
    },
    ru: {
      title: "Заказ завершен",
      body: "Услуга успешно оказана. Спасибо!",
    },
  },
  ORDER_ON_THE_WAY: {
    az: {
      title: "Mütəxəssis yoldadır",
      body: "Tezliklə ünvanınıza çatacaq",
    },
    en: {
      title: "Specialist on the way",
      body: "Will arrive at your address soon",
    },
    ru: {
      title: "Специалист в пути",
      body: "Скоро прибудет по вашему адресу",
    },
  },
  ORDER_ACCEPTED: {
    az: {
      title: "Sifariş təsdiqləndi",
      body: "Sifarişiniz qəbul olundu və tezliklə emal olunacaq",
    },
    en: {
      title: "Order Confirmed",
      body: "Your order has been accepted and will be processed shortly",
    },
    ru: {
      title: "Заказ подтвержден",
      body: "Ваш заказ принят и скоро будет обработан",
    },
  },
  ORDER_REJECTED: {
    az: {
      title: "Sifariş ləğv edildi",
      body: "Təəssüf ki, sifarişiniz qəbul oluna bilmədi",
    },
    en: {
      title: "Order Cancelled",
      body: "Unfortunately, your order could not be accepted",
    },
    ru: {
      title: "Заказ отменен",
      body: "К сожалению, ваш заказ не может быть принят",
    },
  },
  REQUEST_ACCEPTED: {
    az: {
      title: "Resept təsdiqləndi",
      body: "Reseptiniz təsdiqləndi. Zəhmət olmasa, təfərrüatları nəzərdən keçirin və randevunuzu təsdiqləmək üçün ödənişə davam edin.",
    },
    en: {
      title: "Prescription Approved",
      body: "Your prescription has been approved. Please review the details and proceed with the payment to confirm your appointment.",
    },
    ru: {
      title: "Рецепт одобрен",
      body: "Ваш рецепт одобрен. Пожалуйста, ознакомьтесь с подробностями и перейдите к оплате, чтобы подтвердить запись на прием.",
    },
  },
} as const;

/**
 * Get a notification message in specified language
 * @param messageKey - Key from NOTIFICATION_MESSAGES
 * @param language - Language code (az, en, ru). Defaults to 'az'
 * @returns Notification title and body in the specified language
 */
export const getNotificationMessage = (
  messageKey: keyof typeof NOTIFICATION_MESSAGES,
  language: Language = "az",
): { title: string; body: string } => {
  return NOTIFICATION_MESSAGES[messageKey][language];
};
