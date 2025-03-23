import { Request, Response } from "express";
import bcrypt from "bcrypt";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { generateJWT } from "../utils/helpers";
import { UserRequest } from "../types";
import s3 from "../utils/aws"; // Import the AWS S3 instance

const UserController = () => {
  // const signUp = async (req: Request, res: Response): Promise<any> => {
  //   try {
  //     logHttp("Adding user with reqBody ==> ", req.body);
  //     const {
  //       name,
  //       surName,
  //       pytroNym,
  //       email,
  //       password,
  //       address,
  //       dob,
  //       country,
  //       gender,
  //       mobileNumber,
  //       lat,
  //       lng,
  //       notificationEnabled,
  //     } = req.body;
  //     console.log("R", req.body);
  //     if (!email || !password) {
  //       throw {
  //         statusCode: 400,
  //         message: "Email and password are required",
  //       };
  //     }

  //     logHttp("Finding user with email ==> ", email);
  //     let user = await __db.user.findFirst({
  //       where: {
  //         email,
  //         isDeleted: false,
  //       },
  //     });

  //     if (user) {
  //       throw {
  //         statusCode: 409,
  //         message: "User already exists with this email",
  //       };
  //     }
  //     const hashPassword = await bcrypt.hash(password, 10);

  //     logHttp("Creating user");
  //     await __db.user.create({
  //       data: {
  //         name,
  //         surName,
  //         pytroNym,
  //         email,
  //         mobileNumber,
  //         address,
  //         dob,
  //         country,
  //         gender,
  //         lat,
  //         lng,
  //         password: hashPassword,
  //         notificationEnabled,
  //         authProvider: "PASSWORD",
  //       },
  //     });
  //     logHttp("Created new user with email", email);
  //     const token = await generateJWT(
  //       { _id: user?.id, type: "ACCESS_TOKEN" },
  //       "365d",
  //     );

  //     return sendSuccessResponse({
  //       res,
  //       message: "User created successfully!!!",
  //       data: {
  //         user,
  //         token,
  //         userExists: false,
  //       },
  //     });
  //   } catch (error: any) {
  //     logError(`Error while signUp ==> `, error?.message);

  //     return sendErrorResponse({
  //       res,
  //       statusCode: error?.statusCode || 500,
  //       error: error.message || "Internal Server Error",
  //     });
  //   }
  // };
  const signUp = async (req: Request, res: Response): Promise<any> => {
    try {
      logHttp("Adding user with reqBody ==> ", req.body);
      const {
        name,
        surName,
        pytroNym,
        email,
        password,
        address,
        dob,
        country,
        gender,
        mobileNumber,
        lat,
        lng,
        notificationEnabled,
      } = req.body;

      if (!email || !password) {
        throw {
          statusCode: 400,
          message: "Email and password are required",
        };
      }

      logHttp("Finding user with email ==> ", email);
      let existingUser = await __db.user.findFirst({
        where: {
          email,
          isDeleted: false,
        },
      });

      if (existingUser) {
        throw {
          statusCode: 409,
          message: "User already exists with this email",
        };
      }

      const hashPassword = await bcrypt.hash(password, 10);

      logHttp("Creating user");
      const newUser = await __db.user.create({
        data: {
          name,
          surName,
          pytroNym,
          email,
          mobileNumber,
          address,
          dob: dob ? new Date(dob) : null,
          country,
          gender,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
          password: hashPassword,
          notificationEnabled:
            notificationEnabled === "true" || notificationEnabled === true,
          authProvider: "PASSWORD",
          isDeleted: false,
        },
      });

      logHttp("Created new user with email", email);
      const token = await generateJWT(
        { _id: newUser.id, type: "ACCESS_TOKEN" },
        "365d",
      );

      return sendSuccessResponse({
        res,
        message: "User created successfully!!!",
        data: {
          ...newUser,
          token,
          userExists: false,
        },
      });
    } catch (error: any) {
      logError(`Error while signUp ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
        error: error.message || "Internal Server Error",
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
          isDeleted: false,
        },
      });

      if (!user) {
        throw {
          statusCode: 400,
          message: "Invalid email or password",
        };
      }

      // Check if user registered with OAuth and doesn't have a password set
      if (!user.password) {
        // Check if we're getting a new password to set
        if (password) {
          logHttp("User has no password set. Setting new password.");
          // Hash and set the new password
          const hashPassword = await bcrypt.hash(password, 10);

          // Update user with new password
          user = await __db.user.update({
            where: { id: user.id },
            data: {
              password: hashPassword,
              // If they originally signed up with OAuth, we'll keep that provider
              // but also allow password login now
            },
          });

          logHttp("Password set successfully for user with email", email);
        } else {
          // No password provided and user doesn't have one
          throw {
            statusCode: 400,
            message:
              "This email was registered using social login. Please use Google/Apple login or set a password.",
            authProvider: user.authProvider,
          };
        }
      } else {
        // User has a password, verify it
        const isMatched = await bcrypt.compare(password, user.password);

        if (!isMatched) {
          throw {
            statusCode: 400,
            message: "Invalid email or password",
          };
        }
      }

      logHttp("Creating jwt");
      const token = await generateJWT(
        { _id: user.id, type: "ACCESS_TOKEN" },
        "365d"
      );
      logHttp("Created jwt");

      // Remove password from response
      const userWithoutPassword = { ...user };
      userWithoutPassword.password = null;

      return sendSuccessResponse({
        res,
        data: {
          ...userWithoutPassword,
          token,
          userExists: true,
        },
      });
    } catch (error: any) {
      logError(`Error while logIn ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error.message || error,
      });
    }
  };

  const verifyEmail = async (req: Request, res: Response): Promise<any> => {
    try {
      logHttp("Verifying email with reqBody ==> ", req.body);
      const { email } = req.body;

      if (!email) {
        throw {
          statusCode: 400,
          message: "Email is required",
        };
      }

      logHttp("Finding user with email ==> ", email);
      let existingUser = await __db.user.findFirst({
        where: {
          email,
          isDeleted: false,
        },
      });
      return sendSuccessResponse({
        res,
        message: existingUser ? "Email already exists" : "Email is available",
        data: {
          userExists: existingUser ? true : false,
          ...existingUser
        },
      });
    } catch (error: any) {
      logError(`Error while verifying email ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
        error: error.message || "Internal Server Error",
      });
    }
  };

  const loginUserWithGoogle = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    try {
      logHttp("Received OAuth login request with reqBody ==> ", req.body);
      const { name, givenName, familyName, email, id, authProvider } = req.body;

      if (!authProvider) {
        throw {
          statusCode: 400,
          message: "authProvider is required (GOOGLE or APPLE)",
        };
      }

      let userExists = true;
      let user;

      // First, try to find user by OAuth ID and provider
      logHttp(`Checking if email exists: ${email}`);
      user = await __db.user.findFirst({
        where: {
          email: email,
          isDeleted: false,
        },
      });
      // If user exists with this email, update their record with OAuth info
      if (user) {
        logHttp(`User found with email. Updating with OAuth provider details`);
        user = await __db.user.update({
          where: { id: user.id },
          data: {
            googleId: id,
            authProvider:
              user.authProvider === "PASSWORD"
                ? authProvider
                : user.authProvider,
            name: user.name || name || givenName || "Unknown",
            surName: user.surName || familyName || "",
          },
        });
        logHttp(`Updated existing user with OAuth details`);
      }

      // Create user if not found by either method
      if (!user) {
        logHttp(`Creating new user for authProvider: ${authProvider}`);
        user = await __db.user.create({
          data: {
            name: name || givenName || "Unknown",
            surName: familyName || "",
            googleId: id,
            email: email || `${id}@appleid.com`,
            authProvider,
            isDeleted: false,
          },
        });
        logHttp("Created new user with", email || `ID: ${id}`);
        userExists = false;
      }

      // Generate JWT Token
      logHttp("Generating JWT for user");
      const token = await generateJWT(
        { _id: user.id, type: "ACCESS_TOKEN" },
        "365d"
      );

      return sendSuccessResponse({
        res,
        data: {
          user,
          token,
          userExists,
        },
      });
    } catch (error: any) {
      logError(`Error in loginUserWithOAuth ==> `, error.message || error);
      return sendErrorResponse({
        res,
        statusCode: error.statusCode || 500,
        error: error.message || "Internal Server Error",
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

      const userResponse = { ...user };
      if (userResponse.password) {
        delete userResponse.password;
      }

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

      if (req.file) {
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: fileName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        };

        const data = await s3.upload(params).promise();
        req.body.imageUrl = data.Location;
      }

      // Create data object with type conversions
      const updateData = {
        ...req.body,
        // Convert lat and lng from string to float if they exist
        ...(req.body.lat && { lat: parseFloat(req.body.lat) }),
        ...(req.body.lng && { lng: parseFloat(req.body.lng) }),
        // Convert date string to Date object if it exists
        ...(req.body.dob && { dob: new Date(req.body.dob) }),
      };

      const user = await __db.user.update({
        where: {
          id: req.user._id,
        },
        data: updateData,
      });

      logHttp("Updated user profile");

      if (user?.password)
        // @ts-ignore
        delete user.password;

      return sendSuccessResponse({
        res,
        data: {
          ...user,
        },
        message: "User profile updated successfully!",
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

  const deleteMyProfile = async (req: UserRequest, res: Response) => {
    try {
      logHttp("Deleting user profile with body ", req.body);

      const userId = req.user._id;

      // Delete related data
      await __db.$transaction(async (transaction) => {
        // Delete from OrderSubCategory (if related to User through orders)
        await transaction.orderSubCategory.deleteMany({
          where: {
            order: {
              userId: userId,
            },
          },
        });

        // Delete from Orders
        await transaction.order.deleteMany({
          where: {
            userId: userId,
          },
        });

        // Delete from Address
        await transaction.address.deleteMany({
          where: {
            userId: userId,
          },
        });

        // Delete user
        await transaction.user.delete({
          where: {
            id: userId,
          },
        });
      });

      logHttp("Deleted user and all related data");

      return sendSuccessResponse({
        res,
        message: "Deleted user profile and all related data successfully!!!",
      });
    } catch (error) {
      logError(`Error while deleteProfile ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  // const deleteMyProfile = async (req: UserRequest, res: Response) => {
  //   try {
  //     logHttp("Setting up user profile with body ", req.body);

  //     const user = await __db.user.update({
  //       where: {
  //         id: req.user._id,
  //       },
  //       data: {
  //         isDeleted: true,
  //       },
  //     });

  //     logHttp("Deleted user profile");

  //     return sendSuccessResponse({
  //       res,
  //       message: "Deleted user profile successfully!!!",
  //     });
  //   } catch (error) {
  //     logError(`Error while deleteProfile ==> `, error?.message);
  //     return sendErrorResponse({
  //       res,
  //       statusCode: error?.statusCode || 400,
  //       error,
  //     });
  //   }
  // };

  const updatePassword = async (req: UserRequest, res: Response) => {
    try {
      logHttp("Updating password with body ", req.body);

      const { password, confirmPassword } = req.body;

      if (!password || !confirmPassword) {
        throw {
          statusCode: 400,
          message: "Both newPassword and confirmPassword are required",
        };
      }

      if (password !== confirmPassword) {
        throw {
          statusCode: 400,
          message: "New password and confirm password do not match",
        };
      }

      const hashPassword = await bcrypt.hash(password, 10);

      await __db.user.update({
        where: {
          id: req.user._id,
        },
        data: {
          password: hashPassword,
        },
      });

      logHttp("Password updated successfully for user", req.user._id);

      return sendSuccessResponse({
        res,
        message: "Password updated successfully",
      });
    } catch (error) {
      logError(`Error while updatePassword ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error.message || "Internal Server Error",
      });
    }
  };

  const resetPassword = async (req: Request, res: Response): Promise<any> => {
    try {
      logHttp("Resetting password with body ==> ", req.body);
      const { email, password } = req.body;

      if (!email || !password) {
        throw {
          statusCode: 400,
          message: "Email and password are required",
        };
      }

      let user = await __db.user.findFirst({
        where: {
          email,
          isDeleted: false,
        },
      });

      if (!user) {
        throw {
          statusCode: 404,
          message: "User not found",
        };
      }

      const hashPassword = await bcrypt.hash(password, 10);

      await __db.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashPassword,
        },
      });

      logHttp("Password reset successfully for user with email ==> ", email);

      return sendSuccessResponse({
        res,
        message: "Password reset successfully",
      });
    } catch (error: any) {
      logError("Error while resetting password ==> ", error?.message);

      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
        error: error.message || "Internal Server Error",
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
    verifyEmail,
    loginUserWithGoogle,
    getMyProfile,
    setMyProfile,
    updatePassword,
    deleteMyProfile,
    resetPassword,
  };
};

export default UserController;
