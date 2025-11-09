import nodemailer from "nodemailer";
import { google } from "googleapis";

const {
  GMAIL_ADDRESS,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
);
oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

export async function sendMail(
  recipientEmail: string,
  subject: string,
  text: string,
) {
  const { token: accessToken } = await oAuth2Client.getAccessToken();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: GMAIL_ADDRESS,
      clientId: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      refreshToken: GOOGLE_REFRESH_TOKEN!,
      accessToken: accessToken!, // optional
    },
  });

  await transporter.sendMail({
    from: `"IMed" <${GMAIL_ADDRESS}>`,
    to: recipientEmail,
    subject: subject,
    text: text,
  });
}
