import { Secret, sign, SignOptions, verify } from "jsonwebtoken";
import { NextFunction, Request } from "express";
import { validationResult } from "express-validator";
import { UserRequest, ValidationError } from "../types";
import { messaging } from "../config/messaging";
import * as bcrypt from "bcrypt";
import { sendMail } from "./sendMail";
import dayjs from "dayjs";
import logger from "./logger";

const SECRET_KEY: Secret = process.env.JWT_SECRET_KEY || "SECRET_KEY";
type DecodedTokenType = {
  userId: string;
  iat: number;
  exp: number;
};

export type DecodedLoginTokenType = {
  _id: string;
  name: string;
  email: string;
  iat: number;
  exp: number;
};

export type OrderSubmitMailBody = {
  id: string;
  medical: { name: string };
  price: number;
  orderDate: string;
  startTime?: number;
  SpecialOffer?: { title_az: string };
  additionalInfo?: string;
  forAnotherPerson: boolean;
  user: { name: string; surname: string; email: string };
};

export const checkValidation = (req: Request) => {
  let errObj: { [key: string]: string } = {};

  const isError: any = validationResult(req);
  if (isError.errors.length > 0) {
    isError.errors.map((err: ValidationError) => {
      errObj[err.path] = err.msg;
    });
    return Object.keys(errObj).length ? errObj : null;
  } else return null;
};

export const validationWrapper = (callback: any): any => {
  return (
    req: Request | UserRequest,
    res: Response,
    next: NextFunction,
  ): any => {
    let errors = checkValidation(req as any);
    if (errors) {
      return next({ message: errors, status: 400 });
    } else {
      callback(req as Request | UserRequest, res, next);
    }
  };
};

export const generateJWT = (
  payload: object,
  expiresIn: string | number = "30d",
): string => {
  return sign(payload, SECRET_KEY, { expiresIn: expiresIn } as SignOptions);
};
export const verifyJWT = (token: string): DecodedLoginTokenType => {
  const decode: DecodedLoginTokenType = verify(
    token,
    SECRET_KEY,
  ) as DecodedLoginTokenType;
  if (!decode) throw new Error("You are not authorized to perform this action");
  return decode;
};

export const decodeToken = (token: string): string => {
  const decodedToken = verify(token, SECRET_KEY) as DecodedTokenType;
  return decodedToken.userId;
};

export const formatTime = (time: number) => {
  // Convert to string and pad with leading zeros if needed
  const timeString = time.toString().padStart(4, "0");

  // Extract hour and minute parts
  const hours = timeString.slice(0, 2);
  const minutes = timeString.slice(2, 4);

  // Return formatted time
  return `${hours}:${minutes}`;
};

const sliceArrayIntoGroups = (tokenArr: any[]) => {
  const arrays = [];
  const size = 400;
  while (tokenArr.length > 0) arrays.push(tokenArr.splice(0, size));
  return arrays;
};

export const sendPostNotifications = async (
  deviceTokens: any[],
  title: string,
  body: string,
  payload: any,
): Promise<any> => {
  try {
    if (deviceTokens.length) {
      const tokens = deviceTokens.map(({ token }) => token);
      const slicedArray = sliceArrayIntoGroups(tokens);
      if (slicedArray[0].length) {
        const pendingPromiseArr = slicedArray.map((tokenArrGroup) => {
          return messaging.sendEachForMulticast({
            tokens: tokenArrGroup,
            data: {
              title,
              body,
              deepLink: payload?.deepLink || "imedapp://default-path",
              // payload: JSON.stringify(payload),
            },
            webpush: {
              fcmOptions: {
                link: payload?.webRedirectUrl || "",
              },
              data: {
                title,
                body,
                payload: JSON.stringify(payload),
              },
            },
            android: {
              data: {
                title,
                body,
                deepLink: payload?.deepLink || "imedapp://default-path",
                // payload: JSON.stringify(payload),
              },
            },
            notification: {
              body,
              title,
            },
          });
        });
        const resolvedDeviceTokensArr =
          await Promise.allSettled(pendingPromiseArr);

        console.log(JSON.stringify(resolvedDeviceTokensArr));
      }
      return slicedArray[0];
    }
    return;
  } catch (error) {
    console.error(JSON.stringify(error));
    return;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePasswords = async (
  plainTextPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

export const sendOrderSubmitMails = (mailBody: OrderSubmitMailBody) => {
  const emails = [
    "support@imed.az",
    "karim.aliyev@caregroup.tech",
    "farhad.abas@caregroup.tech",
    "imed@caregroup.tech",
  ];

  for (const email of emails) {
    sendMail({
      to: email,
      subject: "Yeni sifariş göndərildi",
      text: `
          Sifariş ID: ${mailBody.id}
          Medikal: ${mailBody.medical?.name}
          Məbləğ: ${mailBody.price} AZN
          Tarix üçün: ${dayjs(mailBody.orderDate).format("YYYY-MM-DD")}
          Vaxt üçün: ${mailBody.startTime ? formatTime(mailBody.startTime) : "Qeyd edilməyib"}
          Special offer: ${mailBody.SpecialOffer ? mailBody.SpecialOffer.title_az : "Yoxdur"}
          Əlavə qeyd: ${mailBody.additionalInfo || "Yoxdur"}
          Sifarişi verən şəxs: ${mailBody.user.name} ${mailBody.user.surname} (${mailBody.user.email})
          Başqa şəxs üçün: ${mailBody.forAnotherPerson ? "Bəli" : "Xeyr"}

          Tam sifariş məlumatlarını görmək üçün linkə klikləyin: https://imed.admin.caregroup.tech/orders/${mailBody.id}
          `,
    }).catch((err) => {
      logger.error(`Failed to send email to ${email}: ${err.message}`);
    });
  }
};
