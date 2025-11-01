import dotenv from "dotenv";
dotenv.config();
import dayjs from "dayjs";
import { Response } from "express";
import multer, { FileFilterCallback } from "multer";
import { OrderService } from "../services/orderService";
import { AdminRequest, Payriff, UserRequest } from "../types";
import s3 from "../utils/aws"; // Import the AWS S3 instance
import { sendPostNotifications } from "../utils/helpers";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import prisma from "../config/db";
import { HttpException } from "../utils/exception";

// Set up Multer storage for S3 file upload
const storage = multer.memoryStorage(); // Store the file in memory before uploading it to S3

const fileFilter = (
  req: UserRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // Max file size 10MB
}).array("files");

const orderService = new OrderService();

const OrderController = () => {
  const createOrder = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const data = req.body;
      let specialOffer = null;

      const {
        serviceCat,
        medicalId,
        employeeId,
        address,
        entrance,
        floor,
        intercom,
        apartment,
        date,
        startTime,
        lat,
        lng,
        price,
        additionalInfo,
        paymentMethod,
        forAnotherPerson,
        forAnotherPersonName,
        forAnotherPersonPhone,
        fileUrls = [],
        specialOfferId,
      } = data;

      if (specialOfferId) {
        specialOffer = await __db.specialOffer.findUnique({
          where: { id: specialOfferId },
          include: {
            subCategories: {
              include: {
                category: {
                  include: { service: true },
                },
              },
            },
          },
        });
      }

      if (specialOfferId && !specialOffer) {
        return res.status(404).json({
          msg: "Special offer not found",
          statusCode: 404,
        });
      }

      // Extract serviceId from serviceCat or specialOffer to determine if this is a home doctor call
      let extractedServiceId: number | null = null;

      if (
        specialOffer &&
        specialOffer.subCategories &&
        specialOffer.subCategories.length > 0
      ) {
        // Get serviceId from special offer
        extractedServiceId = specialOffer.subCategories[0].category.service.id;
      } else if (
        serviceCat &&
        Array.isArray(serviceCat) &&
        serviceCat.length > 0
      ) {
        // Get serviceId from serviceCat
        const firstService = serviceCat[0]?.service?.[0];
        if (firstService?.id) {
          extractedServiceId = firstService.id;
        }
      }

      const isHomeDoctorCall = extractedServiceId === 1;

      // Валидации
      if (
        (!serviceCat ||
          !Array.isArray(serviceCat) ||
          serviceCat.length === 0) &&
        !specialOfferId
      ) {
        return res.status(400).json({
          msg: "Service categories are required.",
          statusCode: 400,
        });
      }

      // For non-home doctor calls (serviceId !== 1), medicalId is required
      if (!isHomeDoctorCall && !medicalId && !specialOfferId) {
        return res.status(400).json({
          msg: "Medical ID is required for non-home doctor calls.",
          statusCode: 400,
        });
      }

      if (!["COD", "Card"].includes(paymentMethod)) {
        return res.status(400).json({
          msg: "Invalid payment method. Must be 'COD' or 'Card'",
          statusCode: 400,
        });
      }

      if (
        forAnotherPerson &&
        (!forAnotherPersonName || !forAnotherPersonPhone)
      ) {
        return res.status(400).json({
          msg: "For another person name and phone are required.",
          statusCode: 400,
        });
      }

      // Проверка занятости слота
      const currentDate = new Date(date);
      const slotDay =
        currentDate.getDay() - 1 < 0 ? 6 : currentDate.getDay() - 1;

      if (isHomeDoctorCall && employeeId) {
        // For home doctor calls, check employee availability
        const existingEmployeeOrders = await __db.order.findMany({
          where: {
            employeeId: employeeId,
            orderDate: new Date(date),
            startTime: startTime,
            OR: [{ orderStatus: "pending" }, { orderStatus: "accepted" }],
          },
        });

        const availableEmployeeSlots = await __db.availability.findMany({
          where: { employeeId: employeeId, startTime: startTime, day: slotDay },
        });

        if (
          existingEmployeeOrders.length &&
          existingEmployeeOrders.length >= availableEmployeeSlots.length
        ) {
          return res.status(400).json({
            msg: "The selected employee slot is already booked. Please choose a different slot or employee.",
            statusCode: 400,
          });
        }
      } else if (!isHomeDoctorCall && medicalId) {
        // For medical facility visits, check medical facility availability
        const existingOrder = await __db.order.findMany({
          where: {
            medicalId: medicalId,
            orderDate: new Date(date),
            startTime: startTime,
            OR: [{ orderStatus: "pending" }, { orderStatus: "accepted" }],
          },
        });

        const availableSlots = await __db.availability.findMany({
          where: { medicalId: medicalId, startTime: startTime, day: slotDay },
        });

        if (
          existingOrder.length &&
          existingOrder.length >= availableSlots.length
        ) {
          return res.status(400).json({
            msg: "The selected slot is already booked. Please choose a different slot.",
            statusCode: 400,
          });
        }
      }

      // Fetch medical info only if medicalId is provided (not required for home doctor calls)
      let medical = null;
      if (specialOffer?.medicalId || medicalId) {
        medical = await __db.medical.findUnique({
          where: {
            id: specialOffer ? specialOffer.medicalId : parseInt(medicalId),
          },
          select: { adminId: true },
        });

        if (!medical && !isHomeDoctorCall) {
          return sendErrorResponse({
            res,
            statusCode: 404,
            error: "Medical not found",
          });
        }
      }

      logHttp("extractedServiceId", extractedServiceId);
      // транзакция
      const result = await __db.$transaction(async (tx) => {
        // создаём заказ
        const order = await tx.order.create({
          data: {
            price: specialOffer ? specialOffer.price : price,
            address,
            lat,
            lng,
            entrance,
            intercom,
            floor,
            apartment,
            paymentMethod,
            orderDate: new Date(date),
            startTime,
            // Save serviceId to Order table
            Service: { connect: { id: extractedServiceId ?? undefined } },
            // Connect medical only if medicalId is provided (not required for home doctor calls)
            ...(specialOffer?.medicalId || medicalId
              ? {
                  medical: {
                    connect: {
                      id: specialOffer
                        ? specialOffer.medicalId
                        : parseInt(medicalId),
                    },
                  },
                }
              : {}),
            employee: employeeId ? { connect: { id: employeeId } } : undefined,
            user: { connect: { id: req.user._id } },
            admin: medical?.adminId
              ? { connect: { id: medical.adminId } }
              : undefined,
            additionalInfo,
            forAnotherPerson: forAnotherPerson || false,
            forAnotherPersonName: forAnotherPersonName || null,
            forAnotherPersonPhone: forAnotherPersonPhone || null,
            fileUrl: fileUrls.join(","),
            ...(specialOfferId && {
              SpecialOffer: { connect: { id: specialOfferId } },
            }),
          },
        });

        // создаём подкатегории
        let orderSubCategories: any[] = [];

        if (specialOffer) {
          for (const subCategory of specialOffer.subCategories) {
            const serviceId = subCategory.category.service.id;
            const categoryId = subCategory.category.id;
            const subCategoryId = subCategory.id;

            if (!serviceId || !categoryId || !subCategoryId) {
              throw new Error(
                "Service, Category, and SubCategory are required for each special offer.",
              );
            }

            const sub = await tx.orderSubCategory.create({
              data: { orderId: order.id, serviceId, categoryId, subCategoryId },
            });
            orderSubCategories.push(sub);
          }
        } else {
          for (const serviceCategory of serviceCat) {
            const services = serviceCategory?.service || [];
            for (const service of services) {
              const serviceId = service.id;
              const categories = service?.category || [];

              for (const category of categories) {
                const categoryId = category.id;
                const subCategoryIds = category?.subCategoryId || [];

                if (!serviceId || !categoryId || subCategoryIds.length === 0) {
                  throw new Error(
                    "Service, Category, and SubCategories are required for each service category.",
                  );
                }

                for (const subCategoryId of subCategoryIds) {
                  const sub = await tx.orderSubCategory.create({
                    data: {
                      orderId: order.id,
                      serviceId,
                      categoryId,
                      subCategoryId,
                    },
                  });
                  orderSubCategories.push(sub);
                }
              }
            }
          }
        }

        return { order, orderSubCategories };
      });

      // если заказ для себя, обновляем user.passportUrls
      if (!forAnotherPerson) {
        await __db.user.update({
          where: { id: req.user._id },
          data: { passportUrls: fileUrls },
        });
      }

      return res.json({
        msg: "Order and associated OrderSubCategories created successfully!",
        data: result,
        statusCode: 200,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        msg: "Error creating order and order subcategories.",
        error: error.message,
      });
    }
  };

  const createRequestOrder = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      logHttp("Creating Request Order ", req.body);
      const fileUrls: string[] = []; // Initialize an array to store file URLs

      upload(req, res, async (err) => {
        if (err) {
          logError("Multer Error: ", err);
          return sendErrorResponse({
            res,
            statusCode: 400,
            error: err.message,
          });
        }
        if (req.files && Array.isArray(req.files)) {
          const uploadPromises = req.files.map((file: Express.Multer.File) => {
            const fileName = `${Date.now()}-${file.originalname}`;
            const params = {
              Bucket: process.env.AWS_S3_BUCKET_NAME!,
              Key: fileName,
              Body: file.buffer,
              ContentType: file.mimetype,
            };

            console.log("1");

            return new Promise((resolve, reject) => {
              s3.upload(params, (uploadError: Error | null, data: any) => {
                if (uploadError) {
                  logError("Multer Error: ", uploadError);
                  reject("Error uploading file to S3");
                } else {
                  fileUrls.push(data.Location);
                  resolve(data.Location);
                }
              });
            });
          });
          console.log("2");

          await Promise.all(uploadPromises);
        }

        const { additionalInfo, medicalId, doctor, address = null } = req.body;
        const medical = await __db.medical.findUnique({
          where: { id: parseInt(medicalId) },
          select: { adminId: true, lat: true, lng: true },
        });
        const user = await __db.user.findUnique({
          where: { id: parseInt(req.user._id) },
          select: { lat: true, lng: true },
        });

        if (!medical) {
          return sendErrorResponse({
            res,
            statusCode: 404,
            error: "Medical not found",
          });
        }

        if (!medicalId) {
          console.error("Medical ID is missing");
          throw new Error("Medical ID is required");
        }
        logHttp("3", fileUrls);
        logHttp("Preparing to create request order...");
        const orderData = {
          additionalInfo,
          admin: medical.adminId
            ? { connect: { id: medical.adminId } }
            : undefined,
          user: {
            connect: {
              id: req.user._id,
            },
          },
          lat: user?.lat,
          lng: user?.lng,
          fileUrl: fileUrls.join(","),
          createdAt: new Date(),
          orderDate: new Date(),
          address,
          doctor,
          medical: {
            connect: {
              id: parseInt(medicalId),
            },
          },
        };

        logHttp("Order data:", orderData); // Log the data to verify

        try {
          const requestOrder = await __db.order.create({
            data: orderData as any,
          });

          logHttp("Request order created:", requestOrder); // Log the created order
          return sendSuccessResponse({
            res,
            message: "Request order created successfully!",
            data: requestOrder,
          });
        } catch (error) {
          logError("Error creating request order:", error);
          return sendErrorResponse({
            res,
            statusCode: 400,
            error: "Error creating request order",
          });
        }
      });
    } catch (error) {
      console.error("Unexpected Error: ", error);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message || "Unexpected error occurred",
      });
    }
  };

  const getMyOrders = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const cursor = req.query.cursor
        ? parseInt(req.query.cursor as string)
        : null;

      const status = req.query.status as string;

      logHttp("Fetching orders ==> ", req.user._id);

      // Fetch orders with relations
      const orders = await __db.order.findMany({
        where: {
          userId: req.user._id,
          orderStatus:
            status === "accepted"
              ? {
                  in: ["accepted", "pending"],
                }
              : status,
          startTime: {
            not: null,
          },
        },
        ...(cursor && { cursor: { id: cursor } }),
        ...(cursor && { skip: 1 }),
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              surName: true,
              position: true,
            },
          },
          orderSubCategories: {
            include: {
              service: {
                // Include the related service
                select: {
                  id: true,
                  name: true,
                  iconUrl: true,
                },
              },
              category: {
                // Include the related category
                select: {
                  id: true,
                  name: true,
                  iconUrl: true,
                },
              },
              subCategory: {
                select: {
                  id: true,
                  name: true,
                  iconUrl: true,
                  medicalCategories: {
                    select: {
                      medicalId: true,
                      price: true, // Fetch price from MedicalCategory (for facility visits)
                    },
                  },
                  employeeCategories: {
                    select: {
                      employeeId: true,
                      price: true, // Fetch price from EmployeeCategory (for home doctor calls)
                    },
                  },
                },
              },
            },
          },
          medical: {
            select: {
              id: true,
              name: true,
              iconUrl: true,
              lat: true,
              lng: true,
              address: true,
            },
          },
          SpecialOffer: {
            select: {
              title_az: true,
              title_en: true,
              title_ru: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Format `orderSubCategories` into a flat array of subCategory objects
      const formattedOrders = orders.map((order: any) => ({
        ...order,
        title: order.SpecialOffer?.title || null,
        orderSubCategories: order.orderSubCategories.map((osc: any) => {
          let price = 0;

          // Check if this is a home doctor call (serviceId === 1)
          const isHomeDoctorCall = order.serviceId === 1;

          if (isHomeDoctorCall && order.employeeId) {
            // For home doctor calls, get price from EmployeeCategory
            const employeeCategory = osc.subCategory.employeeCategories?.find(
              (ec: any) => ec.employeeId === order.employeeId,
            );
            price = employeeCategory?.price || 0;
          } else if (order.medicalId) {
            // For facility visits, get price from MedicalCategory
            const medicalCategory = osc.subCategory.medicalCategories?.find(
              (mc: any) => mc.medicalId === order.medicalId,
            );
            price = medicalCategory?.price || 0;
          }

          return {
            id: osc.subCategory.id,
            name: osc.subCategory.name,
            iconUrl: osc.subCategory.iconUrl,
            price,
            service: osc.service, // Add service information
            category: osc.category, // Add category information
          };
        }),
      }));

      const formattedOrder = formattedOrders.map((order: any) => ({
        ...order,
        createdAt: dayjs(order.createdAt).format("YYYY-MM-DD HH:mm:ss.SSS"),
      }));

      logHttp("Fetched orders");

      return sendSuccessResponse({
        res,
        data: {
          orders: formattedOrder,
          cursor: orders.length >= limit ? orders[orders.length - 1].id : null,
        },
      });
    } catch (error: any) {
      logError("Error while getMyOrder ==> ", error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };

  const changeEmployeeStatus = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    const orderId = parseInt(req.params.id as string);
    const employeeStatus = req.body.employeeStatus;

    logHttp("Checking for order in db");
    const order = await __db.order.findFirst({
      where: {
        id: +orderId,
      },
      select: {
        id: true,
        userId: true,
        employeeStatus: true,
      },
    });

    if (!order) throw new Error("No order found");

    switch (employeeStatus) {
      case "processing":
        if (order.employeeStatus != "pending") {
          return sendErrorResponse({
            res,
            error:
              "Employee status can only be changed to 'processing' from 'pending'",
            statusCode: 400,
          });
        }
    }

    logHttp("Changing employee status of order ==> " + employeeStatus);
    await __db.order.update({
      where: {
        id: orderId,
      },
      data: {
        ...req.body,
      },
    });

    return sendSuccessResponse({
      res,
      message: "Employee status of order has been changed successfully",
    });
  };

  const acceptOrRejectOrder = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const orderId = +req.params.id;
      const status = req.body.orderStatus;

      logHttp("Checking for order in db");
      const order = await __db.order.findFirst({
        where: {
          id: +orderId,
        },
        select: {
          id: true,
          userId: true,
          orderStatus: true,
        },
      });

      if (!order) throw new Error("No order found");

      logHttp("Checked for order in db");

      switch (status) {
        case "accepted":
        case "rejected":
          if (order.orderStatus != "pending") {
            return sendErrorResponse({
              res,
              error:
                "Order status can be changed to 'accepted' or 'rejected' only from 'pending'",
            });
          }
          break;
        case "completed":
          if (order.orderStatus != "accepted") {
            return sendErrorResponse({
              res,
              error:
                "Order status can only be changed to 'completed' from 'accepted'",
            });
          }
      }

      logHttp("Accepting or rejecting order ==> ");
      await __db.order.update({
        where: {
          id: orderId,
        },
        data: {
          ...req.body,
        },
      });

      const notification = await __db.notification.create({
        data: {
          title:
            req.body.orderStatus === "accepted"
              ? "Your order has been accepted"
              : "Your order has been rejected",
          body:
            req.body.orderStatus === "accepted"
              ? "You account has been accepted by admin"
              : req.body.declinedReason ||
                "Your order has been rejected by admin",
        },
      });

      await __db.userNotification.create({
        data: {
          user: { connect: { id: order.userId } },
          notification: { connect: { id: notification.id } },
        },
      });

      logHttp("Accepted or rejected order ==> ");

      const tokens = await __db.fcmToken.findMany({
        where: {
          userId: order.userId,
        },
        select: {
          token: true,
        },
      });

      if (tokens)
        await sendPostNotifications(
          tokens,
          req.body.orderStatus === "accepted"
            ? "Your order has been accepted"
            : "Your order has been rejected",
          req.body.orderStatus === "accepted"
            ? "You account has been accepted by admin"
            : req.body.declinedReason,
          {
            deepLink: "imedapp://orders/" + orderId,
          },
        );

      return sendSuccessResponse({
        res,
        message: "Sucess!!!",
      });
    } catch (error: any) {
      logError(`Error while acceptOrRejectOrder ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };
  const cancelOrder = async (req: UserRequest, res: Response) => {
    try {
      const orderId = +req.params.id;
      const amount = req.body.amount;

      logHttp("Checking for order in db");
      const order = await __db.order.findFirst({
        where: {
          id: +orderId,
        },
        select: {
          id: true,
          userId: true,
          orderStatus: true,
          payment_order_id: true,
          paymetStatus: true,
        },
      });

      if (!order) throw new Error("No order found");

      logHttp("Checked for order in db");

      if (order.orderStatus in ["completed", "processing"]) {
        return sendErrorResponse({
          res,
          error:
            "Order status can only be changed to 'canceled-by-user' from 'completed' or 'processing'",
        });
      }

      logHttp("canceling order ==> ");

      if (order.payment_order_id && order.paymetStatus === "success") {
        const body = {
          amount,
          orderId: order.payment_order_id,
        };

        const response = await fetch(Payriff.BASE_URL + `/refund`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: process.env.PAYRIFF_API_KEY || "",
          },
          body: JSON.stringify(body),
        });
        const data = await response.json();

        if (data.code !== Payriff.SUCCESS) {
          logHttp("Unsuccessful refund request", data);

          return sendErrorResponse({
            res,
            statusCode: 400,
            error: "Unsuccessful refund: " + data.message,
          });
        }
      }

      const updateBody: {
        orderStatus: string;
        refounded?: boolean;
        refoundedAmount?: number;
      } = {
        orderStatus: "canceled-by-user",
      };

      if (order.payment_order_id && order.paymetStatus === "success") {
        updateBody.refounded = true;
        updateBody.refoundedAmount = amount;
      }

      await __db.order.update({
        where: {
          id: orderId,
        },
        data: updateBody,
      });

      logHttp("canceled order ==> ");

      return sendSuccessResponse({
        res,
        message: "Success",
      });
    } catch (error: any) {
      logError(`Error while rejecting order ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };

  const getOrders = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const page = parseInt(req.query.page as string) || 1;
      const orderStatus = req.query.orderStatus;
      const from = req.query.from;
      const to = req.query.to;

      const condition: { [key: string]: any } = {
        startTime: { not: null },
        user: { isDeleted: false },
        adminId: req.admin?._id, // 👈 Only show orders for logged-in admin
      };

      if (orderStatus) {
        // here we temporarily show pending orders also if accepted status is chosen
        if (orderStatus === "accepted") {
          condition["orderStatus"] = { in: ["accepted", "pending"] };
        } else {
          condition["orderStatus"] = orderStatus;
        }
      }

      //
      if (from && to) {
        const startDate = new Date(`${from}T00:00:00.000Z`); // Start date
        const endDate = new Date(`${to}T23:59:59.999Z`);
        condition["createdAt"] = {
          gte: startDate, // Greater than or equal to start date
          lte: endDate, // Less than or equal to end date
        };
      }
      condition["startTime"] = {
        not: null, // This filters for orders where startTime is not null
      };
      condition["user"] = {
        isDeleted: false,
      };

      logHttp("Counting orders", condition);
      const count = await __db.order.count({
        where: condition,
      });

      logHttp("Counted orders");

      logHttp("Fetching orders ==> ");
      try {
        let orders = await __db.order.findMany({
          where: condition,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                surName: true,
                position: true,
              },
            },
            orderSubCategories: {
              include: {
                service: true,
                category: {
                  // Include the related category
                  select: {
                    id: true,
                    name: true,
                    iconUrl: true,
                  },
                },
                subCategory: {
                  select: {
                    id: true,
                    name: true,
                    iconUrl: true,
                  },
                },
              },
            },
            medical: {
              select: {
                id: true,
                name: true,
                iconUrl: true,
                lat: true,
                lng: true,
                address: true,
              },
            },
            SpecialOffer: {
              select: {
                title_az: true,
                title_en: true,
                title_ru: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        logHttp("Fetched orders");

        // Format `orderSubCategories` into a flat array of subCategory objects
        const formattedOrders = orders.map((order: any) => ({
          ...order,
          title: order.SpecialOffer?.title || null,
          orderSubCategories: order.orderSubCategories.map((osc: any) => ({
            id: osc.subCategory.id,
            name: osc.subCategory.name,
            iconUrl: osc.subCategory.iconUrl,
          })),
        }));

        return sendSuccessResponse({
          res,
          data: {
            formattedOrders,
            meta: {
              count,
              limit: +limit,
              page: +page,
            },
          },
        });
      } catch (error) {
        console.error("Error creating request order:", error);
        return sendErrorResponse({
          res,
          statusCode: 400,
          error: "Error creating request order",
        });
      }
    } catch (error: any) {
      logError(`Error while getMyOrder ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };
  const getRequestOrder = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const page = parseInt(req.query.page as string) || 1;
      const orderStatus = req.query.orderStatus;
      const from = req.query.from;
      const to = req.query.to;

      const condition: { [key: string]: any } = {};
      if (orderStatus) condition["orderStatus"] = orderStatus;

      // Add date range condition if from and to are provided
      if (from && to) {
        const startDate = new Date(`${from}T00:00:00.000Z`); // Start date
        const endDate = new Date(`${to}T23:59:59.999Z`);
        condition["orderDate"] = {
          gte: startDate, // Greater than or equal to start date
          lte: endDate, // Less than or equal to end date
        };
      }

      // Fetch orders where startTime is null
      condition["startTime"] = null;
      condition["user"] = {
        isDeleted: false,
      };

      logHttp("condistions --->", condition);
      const count = await __db.order.count({
        where: condition,
      });

      logHttp("Counted orders");

      logHttp("Fetching orders ==> ");
      let orders = await __db.order.findMany({
        where: condition,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          // Removed service and category as per the request
          medical: {
            select: {
              id: true,
              name: true,
              iconUrl: true,
            },
          },
          SpecialOffer: {
            select: {
              title_az: true,
              title_en: true,
              title_ru: true,
            },
          },
        },

        orderBy: {
          orderDate: "desc",
        },
      });

      logHttp("Fetched orders");

      return sendSuccessResponse({
        res,
        data: {
          orders: orders.map((order) => {
            return {
              ...order,
              title_az: order.SpecialOffer?.title_az || null,
              title_en: order.SpecialOffer?.title_en || null,
              title_ru: order.SpecialOffer?.title_ru || null,
            };
          }),
          meta: {
            count,
            limit: +limit,
            page: +page,
          },
        },
      });
    } catch (error: any) {
      logError(`Error while getRequestOrder ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };

  const getOrder = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const orderId = Number(req.params.id);

      logHttp("Fetching order");
      let order = await __db.order.findFirst({
        where: {
          id: orderId,
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              surName: true,
              position: true,
            },
          },
          orderSubCategories: {
            include: {
              service: true,
              category: {
                // Include the related category
                select: {
                  id: true,
                  name: true,
                  iconUrl: true,
                },
              },
              subCategory: {
                select: {
                  id: true,
                  name: true,
                  iconUrl: true,
                  medicalCategories: {
                    select: {
                      price: true, // Fetch price from MedicalCategory
                    },
                  },
                },
              },
            },
          },
          medical: {
            select: {
              id: true,
              name: true,
              iconUrl: true,
              lat: true,
              lng: true,
              address: true,
            },
          },
          Service: true,
          user: {
            select: {
              id: true,
              name: true,
              surName: true,
              email: true,
              mobileNumber: true,
              address: true,
              dob: true,
              gender: true,
              country: true,
              lat: true,
              lng: true,
              imageUrl: true,
            },
          },
          SpecialOffer: {
            select: {
              title_az: true,
              title_en: true,
              title_ru: true,
            },
          },
        },
      });

      logHttp("Fetched order");

      if (!order) throw new Error("No order found");
      const userOrderCount = await __db.order.count({
        where: {
          userId: order.user.id, // Assuming userId is the foreign key in the order table
        },
      });
      // Map over the orderSubCategories and preserve the original structure
      const updatedOrderSubCategories = order.orderSubCategories.map(
        (subCategoryObj: any) => ({
          subCategoryId: subCategoryObj.subCategoryId,
          orderId: subCategoryObj.orderId,
          subCategory: {
            id: subCategoryObj.subCategory.id,
            name: subCategoryObj.subCategory.name,
            iconUrl: subCategoryObj.subCategory.iconUrl,
          },
        }),
      );

      return sendSuccessResponse({
        res,
        data: {
          ...order,
          title_az: order.SpecialOffer?.title_az || null,
          title_en: order.SpecialOffer?.title_en || null,
          title_ru: order.SpecialOffer?.title_ru || null,
          user: {
            ...order.user,
            userOrderCount,
          },
          orderSubCategories: updatedOrderSubCategories,
        },
      });
    } catch (error: any) {
      logError(`Error while getOrder ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };

  const calculateDistanceFee = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const medicalId = Number(req.params.id);
      const endpoint = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(req.body.info.address)}&destinations=${encodeURIComponent(`${req.body.info.lat}, ${req.body.info.lng}`)}&key=${"AIzaSyDkG-aWOZsoHrimiH_ls_JZt1JOtiPCY2o"}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(data.error_message || "Failed to fetch distance data");
      }

      const distanceInKm = data.rows[0]?.elements[0]?.distance?.value / 1000;

      if (!distanceInKm) {
        throw new Error(
          "Unable to calculate distance. Please try again later.",
        );
      }

      const distancePricingTiers = await __db.distancePricingTier.findFirst({
        where: {
          medicalId: medicalId,
          minKm: { lte: distanceInKm },
          OR: [{ maxKm: null }, { maxKm: { gt: distanceInKm } }],
        },
      });

      if (!distancePricingTiers) {
        return sendErrorResponse({
          res,
          statusCode: 404,
          error:
            "No distance pricing tiers configured for the specified medical.",
        });
      }

      return sendSuccessResponse({
        res,
        data: { distanceFee: Number(distancePricingTiers.feeAzn) },
      });
    } catch (error: any) {
      console.log("errrr:", error);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error.message || error,
      });
    }
  };

  async function startOrder(req: UserRequest, res: Response) {
    const orderId = +req.params.id;
    const employee = await __db.employee.findUnique({
      where: { userId: req.user._id },
    });

    if (!employee) {
      return sendErrorResponse({
        res,
        error: "Employee not found",
        statusCode: 404,
      });
    }

    const order = await orderService.getOrder(orderId);

    if (!order) {
      return sendErrorResponse({
        res,
        error: "Order not found",
        statusCode: 404,
      });
    }

    if (order.employeeId != employee.id) {
      return sendErrorResponse({
        res,
        error: "This order is not associated with employee",
        statusCode: 400,
      });
    }

    try {
      await orderService.startOrder(order);
    } catch (error: any) {
      return sendErrorResponse({
        res,
        error: error,
        statusCode: error.statusCode ?? 400,
      });
    }

    return sendSuccessResponse({
      res,
      message: "Order started successfully",
    });
  }

  async function startOrderForAdmin(req: AdminRequest, res: Response) {
    const orderId = +req.params.id;
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return sendErrorResponse({
        res,
        error: "Order not found",
        statusCode: 404,
      });
    }

    try {
      await orderService.startOrder(order);
    } catch (error: any) {
      return sendErrorResponse({
        res,
        error: error,
        statusCode: error.statusCode ?? 400,
      });
    }

    return sendSuccessResponse({
      res,
      message: "Order started successfully",
    });
  }

  const completeOrder = async (req: UserRequest, res: Response) => {
    try {
      const orderId = +req.params.id;
      await orderService.completeOrder(orderId);

      return sendSuccessResponse({
        res,
        message: "Order completed successfully",
      });
    } catch (error) {
      logError(`Error while completing order ==>`, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };

  const assignEmployeeToOrder = async (req: UserRequest, res: Response) => {
    try {
      const orderId = +req.params.id;

      const employee = await __db.employee.findFirst({
        where: {
          userId: req.user.id,
        },
      });

      if (!employee) {
        throw new Error("Employee not found");
      }

      const order = await __db.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      await __db.order.update({
        where: { id: orderId },
        data: {
          employeeId: employee.id,
        },
      });

      return sendSuccessResponse({
        res,
        message: "Employee assigned to order",
      });
    } catch (error) {
      logError("Error in assignEmployeeToOrder", error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error: error?.message,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`Order - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`Order - ${context} => ${JSON.stringify(value)}`);

  return {
    createOrder,
    getMyOrders,
    acceptOrRejectOrder,
    cancelOrder,
    getOrders,
    getOrder,
    createRequestOrder,
    getRequestOrder,
    calculateDistanceFee,
    startOrder,
    startOrderForAdmin,
    completeOrder,
    assignEmployeeToOrder,
  };
};

export default OrderController;
