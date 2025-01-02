import { Response } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import s3 from '../utils/aws'; // Import the AWS S3 instance
import { UserRequest } from "../types";
import { formatTime } from "../utils/helpers";

// Set up Multer storage for S3 file upload
const storage = multer.memoryStorage(); // Store the file in memory before uploading it to S3

const fileFilter = (req: UserRequest, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size 10MB
}).single('file');

const OrderController = () => {
  const createOrder = async (req: UserRequest, res: Response): Promise<any> => {
    console.log("asdasd")
    try {
      const {
        serviceId,
        categoryId,
        subCategoryId,  // Array of subCategoryIds to associate with the order
        medicalId,
        userId,
        price,
        address,
        lat,
        lng,
        orderDate,
        startTime,
        endTime,
        additionalInfo,
        fileUrl,
      } = req.body;
  
      // Validate required fields
      if (!serviceId || !categoryId || !subCategoryId || !medicalId  ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const formatedTime = formatTime(+req.body.startTime);
  
      // Create the order with associated subcategories
      const order = await __db.order.create({
        data: {
          category: { connect: { id: categoryId } }, // Linking category
        medical: { connect: { id: medicalId } },   // Linking medical
        user: { connect: { id: req.user._id, } },         // Linking user
        service: { connect: { id: serviceId } },  
          price,
          address,
          lat,
          lng,
          orderDate: new Date(`${req.body.date} ${formatedTime}`),  // Convert to Date type
          startTime,
          endTime,
          additionalInfo,
          fileUrl,
          orderSubCategories: {
            create: subCategoryId.map((subCategoryId: number) => ({
              subCategoryId,  // Link the subCategoryId to the OrderSubCategory
            })),
          },
          
        },
      });
  
      return res.status(201).json({
        status: true,
        message: "Order created successfully",
        data: order,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      return res.status(500).json({
        status: false,
        error: "An error occurred while creating the order",
      });
    }
  };
  const createRequestOrder = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Multer Error: ", err);
          return sendErrorResponse({
            res,
            statusCode: 400,
            error: err.message,
          });
        }

        const { additionalInfo, medicalId, address, lat, lng } = req.body;
  
        // Ensure lat and lng are numbers (floats)
        const latFloat = parseFloat(lat);
        const lngFloat = parseFloat(lng);
  
        // Check if the lat and lng are valid numbers
        if (isNaN(latFloat) || isNaN(lngFloat)) {
          console.error("Invalid lat or lng values");
          return sendErrorResponse({
            res,
            statusCode: 400,
            error: "Invalid latitude or longitude values",
          });
        }
  
        // Check if the medicalId exists
        if (!medicalId) {
          console.error("Medical ID is missing");
          throw new Error("Medical ID is required");
        }
  
        // Handle file upload to S3
        let fileUrl = null;
        if (req.file) {
          const fileName = `${Date.now()}-${req.file.originalname}`;
          const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          };
          try {
            const data = await s3.upload(params).promise();
            fileUrl = data.Location; // The URL of the uploaded file in S3
          } catch (uploadError) {
            console.error("S3 Upload Error: ", uploadError); // Log S3 upload error
            return sendErrorResponse({
              res,
              statusCode: 500,
              error: "Error uploading file to S3",
            });
          }
        }
  
        // Log form fields before database operation
        console.log("Form data:", {
          additionalInfo,
          medicalId,
          address,
          latFloat,
          lngFloat,
        });
  
        // Create the request order in the database
        try {
          const requestOrder = await __db.order.create({
            data: {
              additionalInfo,
              user: {
                connect: {
                  id: req.user._id, // Correctly connect the user
                },
              },
              fileUrl,
              createdAt: new Date(),
              orderDate: new Date(),
              address,
              lat: latFloat, // Store lat as Float
              lng: lngFloat, // Store lng as Float
              medical: {
                connect: {
                  id: parseInt(medicalId), // Use connect to relate the existing medical record
                },
              },
            },
          });
          return sendSuccessResponse({
            res,
            message: "Request order created successfully!",
            data: requestOrder,
          });
        } catch (dbError) {
          console.error("Database Error: ", dbError); // Log database error
          return sendErrorResponse({
            res,
            statusCode: 500,
            error: "Error creating request order in the database",
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
  //     const cursor = parseInt(req.query.cursor as string) || "";
  //     const select = {
  //       id: true,
  //       name: true,
  //       iconUrl: true,
  //     };

  //     logHttp("Fetching orders ==> ");
  //     let orders = await __db.order.findMany({
  //       where: {
  //         userId: req.user._id,
  //         orderStatus: req.query.status as string,
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
  //         subCategory: {
  //           select,
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
  //         orderDate: "desc",
  //       },
  //     });

  //     logHttp("Fetched orders");

  //     return sendSuccessResponse({
  //       res,
  //       data: {
  //         orders,
  //         cursor:
  //           orders.length >= limit ? orders[orders.length - 1]["id"] : null,
  //       },
  //     });
  //   } catch (error: any) {
  //     logError(`Error while getMyOrder ==> `, error?.message);
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
      const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : null;
      const select = {
        id: true,
        name: true,
        iconUrl: true,
      };
  
      logHttp("Fetching orders ==> ", req.user._id);
      const orders = await __db.order.findMany({
        where: {
          userId: req.user._id,
          orderStatus: req.query.status as string,
        },
        ...(cursor && { cursor: { id: cursor } }),
        ...(cursor && { skip: 1 }),
        take: limit,
        include: {
          service: {
            select,
          },
          category: {
            select,
          },
          orderSubCategories: {
            include: {
              subCategory: {
                select,
              },
            },
          },
          medical: {
            select: {
              ...select,
              lat: true,
              lng: true,
              address: true,
            },
          },
        },
        orderBy: {
          orderDate: "desc",
        },
      });
  
      // Format `orderSubCategories` into a flat array of subCategory objects
      const formattedOrders = orders.map((order: any) => ({
        ...order,
        orderSubCategories: order.orderSubCategories.map((osc: any) => ({
          id: osc.subCategory.id,
          name: osc.subCategory.name,
          iconUrl: osc.subCategory.iconUrl,
        })),
      }));
  
      logHttp("Fetched orders");
  
      return sendSuccessResponse({
        res,
        data: {
          orders: formattedOrders,
          cursor:
            orders.length >= limit ? orders[orders.length - 1].id : null,
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
  
  const acceptOrRejeectOrder = async (
    req: UserRequest,
    res: Response
  ): Promise<any> => {
    try {
      const orderId = +req.params.id;

      logHttp("Checking for order in db");
      const order = await __db.order.findFirst({
        where: {
          id: +orderId,
        },
        select: {
          id: true,
        },
      });

      if (!order) throw new Error("No order found");

      logHttp("Checked for order in db");

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

      return sendSuccessResponse({
        res,
        message: "Sucess!!!",
      });
    } catch (error: any) {
      logError(`Error while acceptOrRejeectOrder ==> `, error?.message);
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

      const condition: { [key: string]: any } = {};
      if (orderStatus) condition["orderStatus"] = orderStatus;

      //
      if (from && to) {
        const startDate = new Date(`${from}T00:00:00.000Z`); // Start date
        const endDate = new Date(`${to}T23:59:59.999Z`);
        condition["orderDate"] = {
          gte: startDate, // Greater than or equal to start date
          lte: endDate, // Less than or equal to end date
        };
      }
      condition["user"] = {
        isDeleted: false,
      };

      logHttp("Counting orders");
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
          service: {
            select,
          },
          category: {
            select,
          },
          orderSubCategories: {
            include: {
              subCategory: {
                select,
              },
            },
          },
          medical: {
            select,
          },
        },
        orderBy: {
          orderDate: "desc",
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
    } catch (error: any) {
      logError(`Error while getMyOrder ==> `, error?.message);
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
        service: {
          select,
        },
        category: {
          select,
        },
        orderSubCategories: {
          include: {
            subCategory: {
              select,
            },
          },
        },
        medical: {
          select,
        },
        user: {
          select: {
            name: true,
            dob: true,
            mobileNumber: true,
            email: true,
          },
        },
      },
    });

    logHttp("Fetched order");

    if (!order) throw new Error("No order found");

   // Map over the orderSubCategories and preserve the original structure
   const updatedOrderSubCategories = order.orderSubCategories.map((subCategoryObj: any) => ({
    subCategoryId: subCategoryObj.subCategoryId,
    orderId: subCategoryObj.orderId,
    subCategory: {
      id: subCategoryObj.subCategory.id,
      name: subCategoryObj.subCategory.name,
      iconUrl: subCategoryObj.subCategory.iconUrl,
    },
  }));

    return sendSuccessResponse({
      res,
      data: {
        ...order,
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


  const logHttp = (context: string, value?: any) =>
    logger.http(`Order - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`Order - ${context} => ${JSON.stringify(value)}`);

  return {
    createOrder,
    getMyOrders,
    acceptOrRejeectOrder,
    getOrders,
    getOrder,
    createRequestOrder
  };
};

export default OrderController;
