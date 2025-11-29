import { Language } from "index";

export const MAIL_TEMPLATES = {
  PAYMENT_SUCCESSFUL: {
    en: {
      subject: "Thank you for your payment",
      body: (options: { name: string }) => `
    <!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Thank you for your payment</title>
    </head>
    <body style="margin:0; padding:0; background-color:#ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0"
                           style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#000000;">
                        
                        <tr>
                            <td style="padding:24px;">
                                
                                <!-- Title -->
                                <h1 style="margin:0 0 16px 0; font-size:22px; font-weight:700;">
                                    Thank you for your payment
                                </h1>

                                <hr style="border:0; border-top:1px solid #e0e0e0; margin:0 0 16px 0;">

                                <!-- Greeting -->
                                <p style="margin:0 0 12px 0; font-size:16px; line-height:1.6;">
                                    Hi ${options.name},
                                </p>

                                <!-- Main message -->
                                <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
                                    Your payment was successful. Thank you for your payment!
                                </p>

                                <hr style="border:0; border-top:1px solid #e0e0e0; margin:16px 0;">

                                <!-- Footer -->
                                <p style="margin:0; font-size:16px; line-height:1.6;">
                                    Best regards,<br>
                                    The IMed Team
                                </p>

                            </td>
                        </tr>
                    
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
  `,
    },
    az: {
      subject: "Ödənişiniz üçün təşəkkür edirik",
      body: (options: { name: string }) => `
    <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Ödənişiniz üçün təşəkkür edirik</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0"
                       style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#000000;">

                    <tr>
                        <td style="padding:24px;">

                            <!-- Title -->
                            <h1 style="margin:0 0 16px 0; font-size:22px; font-weight:700;">
                                Ödənişiniz üçün təşəkkür edirik
                            </h1>

                            <hr style="border:0; border-top:1px solid #e0e0e0; margin:0 0 16px 0;">

                            <!-- Greeting -->
                            <p style="margin:0 0 12px 0; font-size:16px; line-height:1.6;">
                                Salam ${options.name},
                            </p>

                            <!-- Main message -->
                            <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
                                Ödənişiniz uğurla həyata keçirildi. Ödəniş etdiyiniz üçün təşəkkür edirik!
                            </p>

                            <hr style="border:0; border-top:1px solid #e0e0e0; margin:16px 0;">

                            <!-- Footer -->
                            <p style="margin:0; font-size:16px; line-height:1.6;">
                                Hörmətlə,<br>
                                İMed komandası
                            </p>

                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`,
    },
    ru: {
      subject: "Спасибо за ваш платеж",
      body: (options: { name: string }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Спасибо за вашу оплату</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0"
                       style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#000000;">

                    <tr>
                        <td style="padding:24px;">

                            <!-- Title -->
                            <h1 style="margin:0 0 16px 0; font-size:22px; font-weight:700;">
                                Спасибо за вашу оплату
                            </h1>

                            <hr style="border:0; border-top:1px solid #e0e0e0; margin:0 0 16px 0;">

                            <!-- Greeting -->
                            <p style="margin:0 0 12px 0; font-size:16px; line-height:1.6;">
                                Здравствуйте ${options.name},
                            </p>

                            <!-- Main message -->
                            <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
                                Ваш платёж успешно выполнен. Спасибо за вашу оплату!
                            </p>

                            <hr style="border:0; border-top:1px solid #e0e0e0; margin:16px 0;">

                            <!-- Footer -->
                            <p style="margin:0; font-size:16px; line-height:1.6;">
                                С уважением,<br>
                                Команда IMed
                            </p>

                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`,
    },
  },
  ORDER_COMPLETED: {
    en: {
      subject: "Order Completed",
      body: (options: { name: string; orderId: number }) => `
    <!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Order completed</title>
    </head>
    <body style="margin:0; padding:0; background-color:#ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0"
                           style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#000000;">
                        
                        <tr>
                            <td style="padding:24px;">
                                
                                <!-- Title -->
                                <h1 style="margin:0 0 16px 0; font-size:22px; font-weight:700;">
                                    Order completed
                                </h1>

                                <hr style="border:0; border-top:1px solid #e0e0e0; margin:0 0 16px 0;">

                                <!-- Greeting -->
                                <p style="margin:0 0 12px 0; font-size:16px; line-height:1.6;">
                                    Hi ${options.name},
                                </p>

                                <!-- Main message -->
                                <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
                                    Your order #${options.orderId} has been completed successfully. Thank you!
                                </p>

                                <hr style="border:0; border-top:1px solid #e0e0e0; margin:16px 0;">

                                <!-- Footer -->
                                <p style="margin:0; font-size:16px; line-height:1.6;">
                                    Best regards,<br>
                                    The IMed Team
                                </p>

                            </td>
                        </tr>
                    
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
  `,
    },
    az: {
      subject: "Sifariş tamamlandı",
      body: (options: { name: string; orderId: number }) => `
    <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Sifariş Tamamlandı</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0"
                       style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#000000;">

                    <tr>
                        <td style="padding:24px;">

                            <!-- Title -->
                            <h1 style="margin:0 0 16px 0; font-size:22px; font-weight:700;">
                                Sifariş Tamamlandı
                            </h1>

                            <hr style="border:0; border-top:1px solid #e0e0e0; margin:0 0 16px 0;">

                            <!-- Greeting -->
                            <p style="margin:0 0 12px 0; font-size:16px; line-height:1.6;">
                                Salam ${options.name},
                            </p>

                            <!-- Main message -->
                            <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
                                ${options.orderId} nömrəli sifarişiniz uğurla tamamlandı. Təşəkkür edirik!
                            </p>

                            <hr style="border:0; border-top:1px solid #e0e0e0; margin:16px 0;">

                            <!-- Footer -->
                            <p style="margin:0; font-size:16px; line-height:1.6;">
                                Hörmətlə,<br>
                                İMed komandası
                            </p>

                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`,
    },
    ru: {
      subject: "Заказ завершен",
      body: (options: { name: string; orderId: number }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Заказ выполнен</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0"
                       style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#000000;">

                    <tr>
                        <td style="padding:24px;">

                            <!-- Title -->
                            <h1 style="margin:0 0 16px 0; font-size:22px; font-weight:700;">
                                Заказ выполнен
                            </h1>

                            <hr style="border:0; border-top:1px solid #e0e0e0; margin:0 0 16px 0;">

                            <!-- Greeting -->
                            <p style="margin:0 0 12px 0; font-size:16px; line-height:1.6;">
                                Здравствуйте ${options.name},
                            </p>

                            <!-- Main message -->
                            <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
                                Ваш заказ № ${options.orderId} успешно выполнен. Спасибо!
                            </p>

                            <hr style="border:0; border-top:1px solid #e0e0e0; margin:16px 0;">

                            <!-- Footer -->
                            <p style="margin:0; font-size:16px; line-height:1.6;">
                                С уважением,<br>
                                Команда IMed
                            </p>

                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`,
    },
  },
};

export const getMailTemplate = (
  templateKey: keyof typeof MAIL_TEMPLATES,
  language: Language = "az",
): { subject: string; body: (options: Record<string, any>) => string } => {
  return MAIL_TEMPLATES[templateKey][language];
};
