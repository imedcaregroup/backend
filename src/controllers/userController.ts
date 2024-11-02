import { Request, Response } from "express";
import prisma from "../config/db";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { generateJWT } from "../utils/helpers";
import { UserRequest } from "../types";

const UserController = () => {
  const loginUserWithGoogle = async (
    req: Request,
    res: Response,
  ): Promise<any> => {
    try {
      logHttp("Adding user with reqBody ==> ", req.body);
      const { name, givenName, familyName, email, id, photo } = req.body;

      logHttp("Finding user with email ==> ", email);
      let user = await prisma.user.findFirst({
        where: {
          googleId: id,
        },
      });

      if (!user) {
        logHttp("Creating new user with email ", email);
        user = await prisma.user.create({
          data: {
            name,
            surName: familyName || givenName,
            googleId: id,
            email,
            authProvider: "GOOGLE",
          },
        });
        logHttp("Created new user with email ", email);
      }

      logHttp("Creating jwt");
      const token = await generateJWT(
        { _id: user?.id, tyep: "ACCESS_TOKEN" },
        "365d",
      );
      logHttp("Created jwt");

      return sendSuccessResponse({
        res,
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      logError(`Error while loginUserWithGoogle ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const getMyProfile = async (req: UserRequest, res: Response) => {
    try {
      logHttp("Getting user profile with id ", req.user.id);
      const user = await prisma.user.findFirst({
        where: {
          id: req.user.id,
        },
      });

      logHttp("Got user profile with id ", req.user.id);

      return sendSuccessResponse({
        res,
        data: {
          ...user,
        },
      });
    } catch (error) {
      logError(`Error while getMyProfile ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const setMyProfile = async (req: UserRequest, res: Response) => {
    try {
      logHttp("Setting up user profile with body ", req.body);

      const user = await prisma.user.update({
        where: {
          id: req.user._id,
        },
        data: {
          ...req.body,
          ...(req.body.dob && { dob: new Date(req.body.dob) }),
        },
      });

      logHttp("Setted user profile");

      return sendSuccessResponse({
        res,
        data: {
          ...user,
        },
        message: "Setted user profile successfully!!!",
      });
    } catch (error) {
      logError(`Error while setMyProfile ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`User - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`User - ${context} => ${JSON.stringify(value)}`);

  return {
    loginUserWithGoogle,
    getMyProfile,
    setMyProfile,
  };
};

export default UserController;
