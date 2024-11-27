import { Response, NextFunction } from "express";
import prisma from "../config/db";
import { sendErrorResponse } from "../utils/response";
import logger from "../utils/logger";
import { verifyJWT } from "../utils/helpers";
import { UserRequest } from "../types";

export const authMiddleware = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      const token = req.headers.authorization.split(" ")[1];
      const decode: any = await verifyJWT(token);

      if (decode.type === "RESET_PASSWORD") {
        if (
          !req.baseUrl.concat(req.url).includes("user/reset-password") ||
          req.method.toLowerCase() != "patch"
        )
          throw new Error("Not authorized for this action");
      }

      const user = await prisma.user.findFirst({
        where: {
          id: decode?._id,
        },
      });

      if (!user) throw new Error("No user found");

      req.user = {
        _id: user.id,
        email: user.email,
        googleId: user?.googleId,
        authProvider: user?.authProvider,
      };

      next();
    } else {
      throw new Error("You are not logged in");
    }
  } catch (error) {
    logger.error(
      `Error while authenticating user ==> ${JSON.stringify(error.message)}`
    );
    sendErrorResponse({
      res,
      error: error.message,
      statusCode: error.statusCode,
    });
  }
};
