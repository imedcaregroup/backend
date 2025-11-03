import { Response } from "express";
import { UserRequest } from "../types";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { Prisma } from ".prisma/client";

const SpecialOffersController = () => {
  const getSpecialOffers = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const limitRaw = Number(req.query.limit);
      const medicalId = Number(req.query.medicalId);
      const search = req.query.search as string | undefined;
      const startsAtSort = req.query.startsAtSort as "asc" | "desc" | undefined;
      const priceSort = req.query.priceSort as "asc" | "desc" | undefined;
      const minPrice = Number(req.query.minPrice);
      const maxPrice = Number(req.query.maxPrice);

      const where: Prisma.SpecialOfferWhereInput = {
        isActive: true,
        ...(search && search.trim().length > 0
          ? {
              OR: [
                { title_az: { contains: search, mode: "insensitive" } },
                { title_en: { contains: search, mode: "insensitive" } },
                { title_ru: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(Number.isFinite(medicalId) ? { medicalId } : {}),
        price: {
          gte: Number.isFinite(minPrice) ? minPrice : 0,
          lte: Number.isFinite(maxPrice) ? maxPrice : undefined,
        },
        startsAt: {
          lte: new Date(),
        },
        endsAt: {
          gte: new Date(),
        },
      };

      const orderBy: Prisma.SpecialOfferOrderByWithRelationInput[] = [];
      if (startsAtSort) orderBy.push({ startsAt: startsAtSort });
      if (priceSort) orderBy.push({ price: priceSort });
      orderBy.push({ priority: "asc" });

      // only include take if it's a positive finite number
      const take =
        Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;

      const specialOffers = await __db.specialOffer.findMany({
        where,
        ...(orderBy.length ? { orderBy } : {}),
        ...(take ? { take } : {}),
        include: {
          medical: {
            select: {
              id: true,
              name: true,
            },
          },
          subCategories: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logHttp("Fetched special offers");

      return sendSuccessResponse({
        res,
        data: {
          specialOffers,
        },
      });
    } catch (error: any) {
      logError(`Error while getSpecialOffers ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const getSpecialOfferDetails = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const offerId = Number(req.params.id);
      if (!Number.isFinite(offerId)) {
        return sendErrorResponse({
          res,
          statusCode: 400,
          error: "Invalid offer ID",
        });
      }
      const specialOffer = await __db.specialOffer.findUnique({
        where: {
          id: offerId,
          isActive: true,
        },
        include: {
          medical: {
            select: {
              id: true,
              name: true,
              iconUrl: true,
            },
          },
          subCategories: {
            select: {
              id: true,
              name: true,
              name_az: true,
              name_en: true,
              name_ru: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  service: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!specialOffer) {
        return sendErrorResponse({
          res,
          statusCode: 404,
          error: "Special offer not found",
        });
      }
      logHttp("Fetched special offer details", specialOffer);
      return sendSuccessResponse({
        res,
        data: {
          specialOffer,
        },
      });
    } catch (error: any) {
      logError(`Error while getSpecialOfferDetails ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const createSpecialOffer = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const {
        medicalId,
        subCategoryIds,
        price,
        startsAt,
        endsAt,
        priority,
        imageUrl_az,
        imageUrl_en,
        imageUrl_ru,
        title_az,
        title_en,
        title_ru,
        description_az,
        description_en,
        description_ru,
        originalPrice,
        discountType,
        discountValue,
        isActive,
      } = req.body;

      const specialOffer = await __db.specialOffer.create({
        data: {
          title_en,
          title_az,
          title_ru,
          description_az,
          description_en,
          description_ru,
          imageUrl_az,
          imageUrl_en,
          imageUrl_ru,
          medicalId,
          isActive,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
          priority: Number.isFinite(priority) ? priority : 0,
          subCategories: {
            connect: subCategoryIds.map((id: number) => ({ id })),
          },
          price,
          originalPrice,
          discountType,
          discountValue,
        },
      });
      logHttp("Created special offer", specialOffer);
      return sendSuccessResponse({
        res,
        data: {
          specialOffer,
        },
      });
    } catch (error: any) {
      logError(`Error while createSpecialOffer ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const changeSpecialOfferStatus = async (
    req: UserRequest,
    res: Response,
  ): Promise<any> => {
    try {
      const offerId = Number(req.params.id);
      if (!Number.isFinite(offerId)) {
        return sendErrorResponse({
          res,
          statusCode: 400,
          error: "Invalid offer ID",
        });
      }
      const specialOffer = await __db.specialOffer.update({
        where: {
          id: offerId,
        },
        data: {
          isActive: req.body.isActive,
        },
      });

      logHttp("Toggled special offer activation", specialOffer);
      return sendSuccessResponse({
        res,
        data: {
          specialOffer,
        },
      });
    } catch (error: any) {
      logError(`Error while toggleActivateSpecialOffer ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`SpecialOffer - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`SpecialOffer - ${context} => ${JSON.stringify(value)}`);

  return {
    getSpecialOffers,
    getSpecialOfferDetails,
    createSpecialOffer,
    changeSpecialOfferStatus,
  };
};

export default SpecialOffersController;
