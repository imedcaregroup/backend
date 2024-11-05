import { Response } from "express";

type SuccessResponseType = {
  data?: object;
  message: string;
  token?: string;
  status: boolean;
};

type ErrorResponseType = {
  status: boolean;
  error?: string;
};

type SuccessParamType = {
  res: Response;
  data?: object;
  token?: string;
  message?: string;
  statusCode?: number;
};

type ErrorParamType = {
  res: Response;
  error: string | any;
  statusCode?: number;
};
export const sendSuccessResponse = ({
  res,
  data,
  token,
  message = "Success",
  statusCode = 200,
}: SuccessParamType): void => {
  const responseObj: SuccessResponseType = { message, status: true };
  if (data) responseObj.data = data;
  if (token) responseObj.token = token;
  res.status(statusCode).send(responseObj);
};

export const sendErrorResponse = ({
  res,
  error,
  statusCode = 500,
}: ErrorParamType): void => {
  const responseObj: ErrorResponseType = {
    error: error?.message || error?.response?.data || error,
    status: false,
  };
  res.status(statusCode).send(responseObj);
};
