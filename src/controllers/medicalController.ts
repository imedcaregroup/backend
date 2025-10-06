import { Response, Request } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest, AdminRequest } from "index";
import { getMedicalsBySubcategory as getMedicalsBySubcategoryQuery } from "../queries/medical";

const MedicalController = () => {
  const getMedicalsBySubcategory = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const limit = Number.parseInt(req.query.limit as string) || 10;
      const sortOrder = (
        (req.query.sortOrder as string) || "ASC"
      ).toUpperCase() as "ASC" | "DESC";

      const subCategoryIds =
        typeof req.query.subCategoryIds === "string"
          ? (req.query.subCategoryIds as string)
              .split(",")
              .map((x) => Number.parseInt(x))
              .filter(Number.isFinite)
          : [];

      if (subCategoryIds.length === 0) {
        return res.status(400).json({ message: "subCategoryIds is required" });
      }

      // 2) Fetch only what you need
      const [medicals, subCategories] = await Promise.all([
        global.__db.medicalCategory.findMany({
          where: { subCategoryId: { in: subCategoryIds } },
          select: {
            medicalId: true,
            price: true,
            subCategoryId: true,
            subCategory: { select: { id: true, name: true } },
            medical: { select: { id: true, name: true, iconUrl: true } },
          },
          orderBy: [{ medicalId: "asc" }, { subCategoryId: "asc" }],
        }),
        global.__db.subCategory.findMany({
          where: { id: { in: subCategoryIds } },
          select: { id: true, name: true },
          orderBy: { id: "asc" },
        }),
      ]);

      const grouped = Object.groupBy(medicals, (item) => item.medicalId);
      let result = Object.entries(grouped).map(([medicalId, items]) => ({
        medicalId: Number(medicalId),
        name: items?.[0].medical.name,
        iconUrl: items?.[0].medical.iconUrl,
        isFull: items?.length === subCategoryIds.length,
        totalPrice: items?.reduce((acc, cur) => acc + cur.price, 0) ?? 0,
        subCategories: subCategories.map((subCategory) => {
          const medicalSubCategory = items?.find(
            (i) => i.subCategory.id === subCategory.id,
          );
          return {
            id: subCategory.id,
            name: subCategory.name,
            price: medicalSubCategory?.price,
            isPresented: !!medicalSubCategory,
          };
        }),
      }));

      // 5) Sorting & pagination at the grouped level (stable & predictable)
      result.sort((a, b) => {
        const dir = sortOrder === "ASC" ? 1 : -1;
        // primary: isFull first, then by totalPrice, then medicalId
        if (a.isFull !== b.isFull) return (a.isFull ? -1 : 1) * dir;
        if (a.totalPrice !== b.totalPrice)
          return (a.totalPrice - b.totalPrice) * dir;
        return (a.medicalId - b.medicalId) * dir;
      });

      result = result.slice(0, limit);

      return sendSuccessResponse({
        res,
        data: {
          medicals: result,
        },
      });
    } catch (error: any) {
      logError(`Error while getMedicalsBySubcategory ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const getTopMedicalPartners = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      // Fetching all partners
      const topPartners = await global.__db.medical.findMany({
        where: {
          isActive: true,
        },
      });

      // Iterate through the results to ensure services are in JSON format
      // topPartners.forEach(partner => {
      //   // If the services field is stored as a string, parse it into an array
      //   if (typeof partner.services === 'string') {
      //     try {
      //       partner.services = JSON.parse(partner.services);  // Convert string to JSON array if needed
      //     } catch (e) {
      //       console.error("Error parsing services field:", partner.services, e);
      //       partner.services = []; // In case of error, set services to an empty array
      //     }
      //   }
      // });

      return res.status(200).json({
        success: true,
        data: topPartners,
      });
    } catch (error: any) {
      logError(
        `Error while fetching top medical partners ==> `,
        error?.message,
      );
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
        error,
      });
    }
  };

  const getAll = async (req: Request, res: Response): Promise<any> => {
    try {
      const medicalPartners = await global.__db.medical.findMany({
        orderBy: {
          name: "asc", // Sorting by name in alphabetical order
        },
        where: {
          isActive: true,
        },
      });

      if (!medicalPartners.length) {
        return res.status(404).json({
          success: false,
          message: "No medical partners found",
        });
      }

      return sendSuccessResponse({
        res,
        data: {
          medicalPartners,
        },
      });
    } catch (error) {
      logError(
        `Error while fetching top medical partners ==> `,
        error?.message,
      );
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
        error,
      });
    }
  };

  const getMedicalById = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Medical ID is required.",
        });
      }

      // Fetch the medical entry by ID
      const medical = await global.__db.medical.findUnique({
        where: {
          id: parseInt(id), // Ensure the ID is parsed to an integer
          isActive: true,
        },
      });

      if (!medical) {
        return res.status(404).json({
          success: false,
          message: "Medical entry not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: medical,
      });
    } catch (error: any) {
      logError(`Error while fetching medical by ID ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
        error,
      });
    }
  };

  const getServiceFee = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Medical ID is required.",
        });
      }

      // Fetch the medical service fee
      const serviceFee = await global.__db.medical.findUnique({
        where: {
          id: parseInt(id), // Ensure the ID is parsed to an integer
          isActive: true,
        },
        select: {
          serviceFee: true,
        },
      });

      if (!serviceFee) {
        return res.status(404).json({
          success: false,
          message: "Medical service fee not found or is inactive.",
        });
      }

      return res.status(200).json({
        success: true,
        data: serviceFee,
      });
    } catch (error: any) {
      logError(
        `Error while fetching service fee of medical ==> `,
        error?.message,
      );
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 500,
        error,
      });
    }
  };

  const searchMedicalSubCategories = async (
    req: AdminRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const adminId = req?.admin?._id;
      if (!adminId) {
        return sendErrorResponse({
          res,
          statusCode: 401,
          error: "Unauthorized",
        });
      }

      const query = (req.query.query as string) || "";
      const limit = parseInt(req.query.limit as string) || 10;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;

      const medical = await global.__db.medical.findFirst({
        where: { adminId },
        include: {
          medicalCatrgories: {
            include: {
              subCategory: {
                include: {
                  category: {
                    include: {
                      service: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!medical) {
        return sendSuccessResponse({ res, data: [] });
      }

      const filtered = medical.medicalCatrgories.filter((mc) => {
        const subCatName = mc?.subCategory?.name || "";
        const normalizedName = subCatName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        const normalizedQuery = query
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        return normalizedName.includes(normalizedQuery);
      });

      const paginated = filtered.slice(skip, skip + limit);

      return sendSuccessResponse({
        res,
        data: {
          results: paginated,
          page,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
        },
      });
    } catch (error: any) {
      logger.error("Medical - searchMedicalSubCategories => ", error?.message);
      return sendErrorResponse({
        res,
        statusCode: 500,
        error,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`Medical - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`Medical - ${context} => ${JSON.stringify(value)}`);

  return {
    getMedicalsBySubcategory,
    getTopMedicalPartners,
    getAll,
    getMedicalById,
    getServiceFee,
    searchMedicalSubCategories,
  };
};

export default MedicalController;
