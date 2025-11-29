import { Request, Response } from "express";
import bcrypt from "bcrypt";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { generateJWT } from "../utils/helpers";
import { UserRequest } from "../types";
import s3 from "../utils/aws";
import { buildIndividualSubmitXml } from "../utils/sendSms";
import { parseStringPromise } from "xml2js";
import axios from "axios"; // Import the AWS S3 instance

const TTL_MS = 2 * 60 * 1000; // 2 minutes

const UserController = () => {
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
        "365d",
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
          ...existingUser,
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
    res: Response,
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
      logHttp(`Finding user with authProvider: ${authProvider} and ID: ${id}`);
      user = await __db.user.findFirst({
        where: {
          authProvider: authProvider,
          googleId: id,
          isDeleted: false,
        },
      });

      // If not found by OAuth ID, check if the email already exists
      if (!user && email) {
        logHttp(
          `User not found with OAuth ID. Checking if email exists: ${email}`,
        );
        user = await __db.user.findFirst({
          where: {
            email: email,
            isDeleted: false,
          },
        });

        // If user exists with this email, update their record with OAuth info
        if (user) {
          logHttp(
            `User found with email. Updating with OAuth provider details`,
          );
          user = await __db.user.update({
            where: { id: user.id },
            data: {
              googleId: id,
              authProvider:
                user.authProvider === "PASSWORD"
                  ? authProvider
                  : user.authProvider,
              // Don't update other fields if they already exist
              name: user.name || name || givenName || "Unknown",
              surName: user.surName || familyName || "",
            },
          });
          logHttp(`Updated existing user with OAuth details`);
        }
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
        "365d",
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

  const requestOtp = async (req: Request, res: Response): Promise<any> => {
    try {
      logHttp("Requesting OTP with reqBody ==> ", req.body);
      const phone = req.body.phoneNumber.replace(/\D/g, ""); // Normalize phone number by removing non-digit characters
      const intent = req.body.intent;
      const now = new Date();

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpHash = await bcrypt.hash(otp, 10);

      // Invalidate any existing OTPs for this phone and intent
      await __db.phoneOtpCode.updateMany({
        where: {
          phone,
          intent,
          expiresAt: { gt: now }, // not expired yet
        },
        data: {
          expiresAt: now, // expire them immediately
        },
      });

      const xmlBody = buildIndividualSubmitXml({
        title: "iMed",
        scheduled: "NOW",
        controlId: `${now.getTime()}`, // must be unique for each task
        recipients: [{ msisdn: phone, message: `Your pin is ${otp}` }],
      });

      const response = await axios.post(
        "https://click.atlsms.az/bulksms/api",
        xmlBody,
        {
          headers: {
            "Content-Type": "application/xml",
          },
          timeout: 15000,
        },
      );
      const xml = response.data;

      // Parse XML → JS object
      const parsed = await parseStringPromise(xml);

      // Extract taskId
      const taskId = parsed.response.body[0].taskid[0];
      if (!taskId) {
        logError("Failed to send OTP SMS", parsed);
        throw {
          statusCode: 500,
          message: "Failed to send OTP SMS",
        };
      }

      // Create a new OTP record
      const otpRecord = await __db.phoneOtpCode.create({
        data: {
          phone,
          intent,
          codeHash: otpHash,
          expiresAt: new Date(now.getTime() + TTL_MS),
          taskId,
        },
      });

      return sendSuccessResponse({
        res,
        message: "OTP generated successfully",
        data: {
          otp: {
            id: otpRecord.id,
          },
        },
      });
    } catch (error: any) {
      logError(`Error while requesting OTP ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
        error: error.message || "Internal Server Error",
      });
    }
  };

  const verifyOtp = async (req: Request, res: Response): Promise<any> => {
    try {
      logHttp("Verifying OTP with reqBody ==> ", req.body);
      const { otpId, code } = req.body;
      const now = new Date();

      // Find the OTP record by id
      const otpRecord = await __db.phoneOtpCode.findFirst({
        where: {
          id: otpId,
          expiresAt: { gt: now },
        },
        orderBy: {
          createdAt: "desc", // use the newest one
        },
      });

      if (!otpRecord) {
        throw {
          statusCode: 404,
          message: "OTP record not found",
        };
      }

      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        throw {
          statusCode: 400,
          message: "Maximum OTP verification attempts exceeded",
        };
      }

      // Verify the OTP code
      const isMatched = await bcrypt.compare(code, otpRecord.codeHash);
      if (!isMatched) {
        // Increment attempts
        await __db.phoneOtpCode.update({
          where: { id: otpRecord.id },
          data: {
            attempts: { increment: 1 },
          },
        });

        throw {
          statusCode: 400,
          message: "Invalid OTP code",
        };
      }

      // OTP is valid, expire it immediately
      await __db.phoneOtpCode.update({
        where: { id: otpRecord.id },
        data: {
          attempts: { increment: 1 },
          expiresAt: now, // expire it immediately
        },
      });

      return sendSuccessResponse({
        res,
        message: "OTP verified successfully",
      });
    } catch (error: any) {
      logError(`Error while verifying OTP ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
        error: error.message || "Internal Server Error",
      });
    }
  };

  const getPassports = async (req: UserRequest, res: Response) => {
    try {
      logHttp("Getting user passports with id ", req.user.id);
      const user = await __db.user.findUnique({
        where: {
          id: req.user._id,
        },
        select: {
          passportUrls: true,
        },
      });
      const passports = user?.passportUrls || [];

      logHttp("Got user passports with id ", req.user.id);

      return sendSuccessResponse({
        res,
        data: passports,
      });
    } catch (error) {
      logError(`Error while getPassports ==> `, error?.message);
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

      // Create a data object with type conversions
      const updateData = {
        ...req.body,
        // Convert lat and lng from string to float if they exist
        ...(req.body.lat && { lat: parseFloat(req.body.lat) }),
        ...(req.body.lng && { lng: parseFloat(req.body.lng) }),
        // Convert a date string to a Date object if it exists
        ...(req.body.dob && { dob: new Date(req.body.dob) }),
        notificationEnabled:
          req.body.notificationEnabled === "true" ||
          req.body.notificationEnabled === true,
      };

      const user = await __db.user.update({
        where: {
          id: req.user._id,
        },
        data: updateData,
      });

      logHttp("Updated user profile");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user;

      return sendSuccessResponse({
        res,
        data: {
          ...safeUser,
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

  const updateLocation = async (req: UserRequest, res: Response) => {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      throw {
        statusCode: 400,
        message: "Both lat and lng are required",
      };
    }

    await __db.user.update({
      where: {
        id: req.user._id,
      },
      data: {
        lat: lat,
        lng: lng,
      },
    });

    logHttp("Updated user location successfully");

    return sendSuccessResponse({
      res,
      message: "Location updated successfully",
    });
  };

  const getLocation = async (req: UserRequest, res: Response) => {
    const userCoords = await __db.user.findFirst({
      where: {
        id: req.user._id,
        isDeleted: false,
      },
      select: {
        lat: true,
        lng: true,
      },
    });

    if (!userCoords) {
      throw {
        statusCode: 404,
        message: "User not found",
      };
    }

    return sendSuccessResponse({
      res,
      message: "Location updated successfully",
      data: {
        lat: userCoords.lat,
        lng: userCoords.lng,
      },
    });
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
    requestOtp,
    verifyOtp,
    getMyProfile,
    setMyProfile,
    updatePassword,
    deleteMyProfile,
    resetPassword,
    updateLocation,
    getLocation,
    getPassports,
  };
};

export default UserController;
