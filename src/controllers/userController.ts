import { Request, Response } from "express";
import bcrypt from "bcrypt";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { generateJWT } from "../utils/helpers";
import { UserRequest } from "../types";

const UserController = () => {
  const signUp = async (req: Request, res: Response): Promise<any> => {
    try {
      logHttp("Adding user with reqBody ==> ", req.body);
      const { name, password, email } = req.body;

      logHttp("Finding user with email ==> ", email);
      let user = await __db.user.findFirst({
        where: {
          email,
        },
      });

      if (user) throw new Error("Email already in use");

      const hashPassword = await bcrypt.hash(password, 10);

      logHttp("Creating user");
      await __db.user.create({
        data: {
          name,
          email,
          password: hashPassword,
          authProvider: "PASSWORD",
        },
      });
      logHttp("Created user");

      return sendSuccessResponse({
        res,
        message: "User created successfully!!!",
      });
    } catch (error: any) {
      logError(`Error while signUp ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const logIn = async (req: Request, res: Response): Promise<any> => {
    try {
      logHttp("Logging user in with reqBody ==> ", req.body);
      const { password, email } = req.body;

      logHttp("Finding user with email ==> ", email);
      let user = await __db.user.findFirst({
        where: {
          email,
        },
      });

      if (!user || !user?.password)
        throw new Error("Invalid email or password");

      const isMatched = await bcrypt.compare(password, user?.password);

      if (!isMatched) throw new Error("Invalid email or password");

      logHttp("Creating jwt");
      const token = await generateJWT(
        { _id: user?.id, tyep: "ACCESS_TOKEN" },
        "365d"
      );
      logHttp("Created jwt");

      user.password = null;

      return sendSuccessResponse({
        res,
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      logError(`Error while logIn ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const loginUserWithGoogle = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    try {
      logHttp("Adding user with reqBody ==> ", req.body);
      const { name, givenName, familyName, email, id, photo } = req.body;
      let userExists = true;

      logHttp("Finding user with email ==> ", email);
      let user = await __db.user.findFirst({
        where: {
          googleId: id,
        },
      });

      if (!user) {
        logHttp("Creating new user with email ", email);
        user = await __db.user.create({
          data: {
            name,
            surName: familyName || givenName,
            googleId: id,
            email,
            authProvider: "GOOGLE",
          },
        });
        logHttp("Created new user with email ", email);
        userExists = false;
      }

      logHttp("Creating jwt");
      const token = await generateJWT(
        { _id: user?.id, tyep: "ACCESS_TOKEN" },
        "365d"
      );
      logHttp("Created jwt");

      return sendSuccessResponse({
        res,
        data: {
          user,
          token,
          userExists,
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
      const user = await __db.user.findFirst({
        where: {
          id: req.user._id,
        },
      });

      logHttp("Got user profile with id ", req.user.id);

      if (user?.password)
        // @ts-ignore
        delete user.password;

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

      const user = await __db.user.update({
        where: {
          id: req.user._id,
        },
        data: {
          ...req.body,
          ...(req.body.dob && { dob: new Date(req.body.dob) }),
        },
      });

      logHttp("Setted user profile");

      if (user?.password)
        // @ts-ignore
        delete user.password;

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

  const updatePassword = async (req: UserRequest, res: Response) => {
    try {
      logHttp("Updating password with body ", req.body);

      if (req.body.password !== req.body.confirmPassword)
        throw new Error("Password and confirm password mismatched");

      const hashPassword = await bcrypt.hash(req.body.password, 10);

      await __db.user.update({
        where: {
          id: req.user._id,
        },
        data: {
          password: hashPassword,
        },
      });

      logHttp("Setted user profile");

      return sendSuccessResponse({
        res,
        message: "Updated password successfully!!!",
      });
    } catch (error) {
      logError(`Error while updatePassword ==> `, error?.message);
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
    signUp,
    logIn,
    loginUserWithGoogle,
    getMyProfile,
    setMyProfile,
    updatePassword,
  };
};

export default UserController;
