import { Response, NextFunction } from "express";
import prisma from "../config/db";
import { sendErrorResponse } from "../utils/response";
import logger from "../utils/logger";
import { verifyJWT } from "../utils/helpers";
import { AdminRequest } from "../types";

// Middleware to authenticate admin users
export const adminAuthMiddleware = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      const token = req.headers.authorization.split(" ")[1];
      const decode: any = await verifyJWT(token);

      // Check if token is meant for admin authentication
      if (decode.type !== "ADMIN_AUTH") {
        throw new Error("Invalid authentication token");
      }

      const admin = await prisma.admin.findFirst({
        where: {
          id: decode?._id,
        },
      });

      if (!admin) throw new Error("Admin not found");

      req.admin = {
        _id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role as "ADMIN" | "SUPER_ADMIN",
      };

      next();
    } else {
      throw new Error("You are not logged in");
    }
  } catch (error) {
    logger.error(
      `Error while authenticating admin ==> ${JSON.stringify(error.message)}`,
    );
    sendErrorResponse({
      res,
      error: error.message,
      statusCode: error.statusCode || 401,
    });
  }
};

// Middleware to restrict access to super admins only
export const superAdminOnly = (
  req: AdminRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.admin) {
      throw new Error("Not authenticated");
    }

    if (req.admin.role !== "SUPER_ADMIN") {
      throw new Error("Access denied. Super admin privileges required");
    }

    next();
  } catch (error) {
    logger.error(
      `Super admin access denied ==> ${JSON.stringify(error.message)}`,
    );
    sendErrorResponse({
      res,
      error: error.message,
      statusCode: 403,
    });
  }
};
