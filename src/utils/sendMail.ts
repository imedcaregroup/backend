import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: false, // false for 587 (STARTTLS), true for 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendMail(options: SendMailOptions) {
  const fromName = process.env.MAIL_FROM_NAME || "No Reply";
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER;

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
