import { sign, verify } from "jsonwebtoken";
import { NextFunction, Request } from "express";
import { validationResult } from "express-validator";
import { UserRequest, ValidationError } from "../types";

const SECRET_KEY = process.env.JWT_SECRET_KEY || "SECRET_KEY";
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
    next: NextFunction
  ): any => {
    let errors = checkValidation(req as any);
    if (errors) {
      return next({ message: errors, status: 400 });
    } else {
      callback(req as Request | UserRequest, res, next);
    }
  };
};

export const generateJWT = (payload: object, expiresIn = "30d"): string => {
  return sign(payload, SECRET_KEY, {
    expiresIn,
  });
};

export const verifyJWT = (token: string): DecodedLoginTokenType => {
  const decode: DecodedLoginTokenType = verify(
    token,
    SECRET_KEY
  ) as DecodedLoginTokenType;
  if (!decode) throw new Error("You are not authorized to perform this action");
  return decode;
};

export const decordToken = (token: string): string => {
  const decodedToken = verify(token, SECRET_KEY) as DecodedTokenType;
  return decodedToken.userId;
};
