import { Response } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import multer, { FileFilterCallback } from "multer";
import s3 from "../utils/aws"; // Import the AWS S3 instance
import { UserRequest } from "../types";
import {sendPostNotifications} from "../utils/helpers";
import dayjs from "dayjs";
import {OrderService} from "../services/orderService";
import {OrderException} from "../utils/exception";

// Set up Multer storage for S3 file upload
const storage = multer.memoryStorage(); // Store the file in memory before uploading it to S3

const fileFilter = (
  req: UserRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback
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

const orderService= new OrderService();

const OrderController = () => {

  const createOrder = async (req: UserRequest, res: Response): Promise<any> => {
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
    } = req.body;
    try {
      // Validate that serviceCat is provided and is an array
      if (
        !serviceCat ||
        !Array.isArray(serviceCat) ||
        serviceCat.length === 0
      ) {
        return res.status(400).json({
          msg: "Service categories are required.",
          statusCode: 400,
        });
      }

      if (!["COD", "Card"].includes(paymentMethod)) {
        return res.status(400).json({
          msg: "Invalid payment method. Must be 'COD' or 'Card'",
          statusCode: 400,
        });
      }

      // Check if the slot is already booked
      const existingOrder = await __db.order.findFirst({
        where: {
          medicalId: medicalId,
          orderDate: new Date(date),
          startTime: startTime,
        },
      });

      if (existingOrder) {
        return res.status(400).json({
          msg: "The selected slot is already booked. Please choose a different slot.",
          statusCode: 400,
        });
      }

      const medical = await __db.medical.findUnique({
        where: { id: parseInt(medicalId) },
        select: { adminId: true },
      });


      if (!medical) {
        return sendErrorResponse({
          res,
          statusCode: 404,
          error: "Medical not found",
        });
      }

      // Create the Order record
      const order = await __db.order.create({
        data: {
          price,
          address,
          lat,
          lng,
          entrance,
          intercom,
          floor,
          apartment,
          orderDate: new Date(date),
          startTime: startTime,
          paymentMethod,
          medical: { connect: { id: medicalId } },
          employee: employeeId
            ? { connect: { id: employeeId }}
            : undefined,
          user: { connect: { id: req.user._id } },
          additionalInfo,
          admin: medical.adminId
            ? { connect: { id: medical.adminId } }
            : undefined,
        },
        include: {
          orderSubCategories: {
            include: {
              service: true, // Include related services
            },
          },
        },
      });

      // Create OrderSubCategory records for each service category in the serviceCat array
      const orderSubCategoriesPromises = serviceCat.map(
        (serviceCategory: any) => {
          const services = serviceCategory?.service || [];

          return services.map((service: any) => {
            const serviceId = service.id;
            const categories = service?.category || [];

            return categories.map((category: any) => {
              const categoryId = category.id;
              const subCategoryIds = category?.subCategoryId || [];

              // Validate extracted data
              if (!serviceId || !categoryId || subCategoryIds.length === 0) {
                return res.status(400).json({
                  msg: "Service, Category, and SubCategories are required for each service category.",
                  statusCode: 400,
                });
              }
              return subCategoryIds.map(async (subCategoryId: number) => {
                console.log(serviceId, categoryId, subCategoryId, order.id);
                // Create OrderSubCategory for each subCategoryId
                try {
                  const orderSubCategory = await __db.orderSubCategory.create({
                    data: {
                      orderId: order.id,
                      serviceId,
                      categoryId,
                      subCategoryId,
                    },
                  });
                  console.log("Created OrderSubCategory:", orderSubCategory);
                  return orderSubCategory;
                } catch (error) {
                  console.error("Error creating OrderSubCategory:", error);
                }
              });
            });
          });
        }
      );

      // Wait for all the promises to resolve
      const orderSubCategories = await Promise.all(
        orderSubCategoriesPromises.flat(2)
      ); // Flatten the array of arrays

      // Return the successful response
      return res.json({
        msg: "Order and associated OrderSubCategories created successfully!",
        data: { order, orderSubCategories },
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        msg: "Error creating order and order subcategories.",
        statusCode: 500,
        error: error.message,
      });
    }
  };
  const createRequestOrder = async (
    req: UserRequest,
    res: Response
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

  // const getMyOrders = async (req: UserRequest, res: Response): Promise<any> => {
  //   try {
  //     const limit = parseInt(req.query.limit as string) || 10;
  //     const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : null;
  //     const select = {
  //       id: true,
  //       name: true,
  //       iconUrl: true,
  //     };

  //     logHttp("Fetching orders ==> ", req.user._id);
  //     const orders = await __db.order.findMany({
  //       where: {
  //         userId: req.user._id,
  //         orderStatus: req.query.status as string,
  //         startTime:{
  //           not:null
  //         }
  //       },
  //       ...(cursor && { cursor: { id: cursor } }),
  //       ...(cursor && { skip: 1 }),
  //       take: limit,
  //       include: {
  //         service: {
  //           select,
  //         },
  //         category: {
  //           select,
  //         },
  //         orderSubCategories: {
  //           include: {
  //             subCategory: {
  //               select: {
  //                 id: true,
  //                 name: true,
  //                 iconUrl: true,
  //                 medicalCatrgories: {
  //                   select: {
  //                     price: true, // Fetch price from MedicalCategory
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //         medical: {
  //           select: {
  //             ...select,
  //             lat: true,
  //             lng: true,
  //             address: true,
  //           },
  //         },
  //       },
  //       orderBy: {
  //         createdAt: "desc",
  //       },
  //     });

  //     // Format `orderSubCategories` into a flat array of subCategory objects
  //     const formattedOrders = orders.map((order: any) => ({
  //       ...order,
  //       orderSubCategories: order.orderSubCategories.map((osc: any) => ({
  //         id: osc.subCategory.id,
  //         name: osc.subCategory.name,
  //         iconUrl: osc.subCategory.iconUrl,
  //         price: osc.subCategory.medicalCatrgories?.[0]?.price || 0,
  //       })),
  //     }));

  //     const formattedOrder = formattedOrders.map(order => ({
  //       ...order,
  //       createdAt: dayjs(order.createdAt).format("YYYY-MM-DD HH:mm:ss.SSS"),
  //     }));

  //     console.log("formattedOrder",formattedOrder)

  //     logHttp("Fetched orders");

  //     return sendSuccessResponse({
  //       res,
  //       data: {
  //         orders: formattedOrder,
  //         cursor:
  //           orders.length >= limit ? orders[orders.length - 1].id : null,
  //       },
  //     });
  //   } catch (error: any) {
  //     logError("Error while getMyOrder ==> ", error?.message);
  //     return sendErrorResponse({
  //       res,
  //       statusCode: error?.statusCode || 400,
  //       error: error?.message,
  //     });
  //   }
  // };
  const getMyOrders = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const cursor = req.query.cursor
        ? parseInt(req.query.cursor as string)
        : null;
      const select = {
        id: true,
        name: true,
        iconUrl: true,
      };

      logHttp("Fetching orders ==> ", req.user._id);

      // Fetch orders with relations
      const orders = await __db.order.findMany({
        where: {
          userId: req.user._id,
          orderStatus: req.query.status as string,
          startTime: {
            not: null,
          },
        },
        ...(cursor && { cursor: { id: cursor } }),
        ...(cursor && { skip: 1 }),
        take: limit,
        include: {
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
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Format `orderSubCategories` into a flat array of subCategory objects
      const formattedOrders = orders.map((order: any) => ({
        ...order,
        orderSubCategories: order.orderSubCategories.map((osc: any) => ({
          id: osc.subCategory.id,
          name: osc.subCategory.name,
          iconUrl: osc.subCategory.iconUrl,
          price: osc.subCategory.medicalCategories?.[0]?.price || 0, // Ensure medicalCategories is correctly referenced
          service: osc.service, // Add service information
          category: osc.category, // Add category information
        })),
      }));

      const formattedOrder = formattedOrders.map((order) => ({
        ...order,
        createdAt: dayjs(order.createdAt).format("YYYY-MM-DD HH:mm:ss.SSS"),
      }));

      console.log("formattedOrder", formattedOrder);

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
    res: Response
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
        employeeStatus: true
      },
    });

    if (!order) throw new Error("No order found");

    switch (employeeStatus) {
      case 'processing':
        if (order.employeeStatus != 'pending') {
          return sendErrorResponse({
            res,
            error: "Employee status can only be changed to 'processing' from 'pending'",
            statusCode: 400
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
    res: Response
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
          orderStatus: true
        },
      });

      if (!order) throw new Error("No order found");

      logHttp("Checked for order in db");

      switch (status) {
        case 'accepted':
        case 'rejected':
          if (order.orderStatus != 'pending') {
            return sendErrorResponse({
              res,
              error: "Order status can be changed to 'accepted' or 'rejected' only from 'pending'",
            });
          }
          break;
        case 'completed':
          if (order.orderStatus != 'accepted') {
            return sendErrorResponse({
              res,
              error: "Order status can only be changed to 'completed' from 'accepted'",
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
            deepLink: "imedapp://orders/"+orderId
          }
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

  const getOrders = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const page = parseInt(req.query.page as string) || 1;
      const orderStatus = req.query.orderStatus;
      const from = req.query.from;
      const to = req.query.to;
      const select = {
        id: true,
        name: true,
        iconUrl: true,
      };

      const condition: { [key: string]: any } = {
        startTime: { not: null },
        user: { isDeleted: false },
        adminId: req.admin?._id, // 👈 Only show orders for logged-in admin
      };
      if (orderStatus) condition["orderStatus"] = orderStatus;

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
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        logHttp("Fetched orders");

        // Format `orderSubCategories` into a flat array of subCategory objects
        const formattedOrders = orders.map((order: any) => ({
          ...order,
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
    res: Response
  ): Promise<any> => {
    try {
      console.log("in here");
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
        },
        orderBy: {
          orderDate: "desc",
        },
      });

      logHttp("Fetched orders");

      return sendSuccessResponse({
        res,
        data: {
          orders,
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
      const select = {
        id: true,
        name: true,
        iconUrl: true,
      };

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
        })
      );

      return sendSuccessResponse({
        res,
        data: {
          ...order,
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
    res: Response
  ): Promise<any> => {
    try {
      const endpoint = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(req.body.info.address)}&destinations=${encodeURIComponent(`${req.body.info.lat}, ${req.body.info.lng}`)}&key=${"AIzaSyDkG-aWOZsoHrimiH_ls_JZt1JOtiPCY2o"}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(data.error_message || "Failed to fetch distance data");
      }
      //
      console.log("data:", JSON.stringify(data));

      const distanceInKm = data.rows[0]?.elements[0]?.distance?.value / 1000;

      let distanceFee = 25;

      if (distanceInKm > 20) {
        distanceFee = 50;
      } else if (distanceInKm > 15) {
        distanceFee = 35;
      }

      return sendSuccessResponse({
        res,
        data: { distanceFee },
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
      where: { userId: req.user.id },
    });

    if (!employee) throw new Error("Employee not found");

    const order = await __db.order.findFirst({
      where: { id: orderId },
      select: { id: true, userId: true },
    });

    if (!order) throw new Error("No order found");

    await __db.order.update({
      where: { id: orderId },
      data: {
        employeeStatus: "processing",
      },
    });

    const tokens = await __db.fcmToken.findMany({
      where: { userId: order.userId },
      select: { token: true },
    });

    if (tokens.length) {
      await sendPostNotifications(
        tokens,
        "Order on the way",
        "Your order is being delivered now.",
        {
          deepLink: "imedapp://orders/"+orderId
        },
      );
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
    getOrders,
    getOrder,
    createRequestOrder,
    getRequestOrder,
    calculateDistanceFee,
    startOrder,
    completeOrder,
    assignEmployeeToOrder,
    changeEmployeeStatus
  };
};

export default OrderController;
