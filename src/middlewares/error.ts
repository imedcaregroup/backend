import { NextFunction, Request, Response } from "express";
import { HttpException } from "../utils/exception";

const errorMiddleware = (
  error: HttpException,
  req: Request,
  res: Response,
  _: NextFunction
) => {
  return res.status(error.status || 500).json({
    success: false,
    error:
      error.message || error?.error || error?.name || error?.stack || error,
    status: error.status || 500,
  });
};

export default errorMiddleware;
