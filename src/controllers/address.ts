import { Response } from "express";
import logger from "../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { UserRequest } from "../types";

const AddressController = () => {
  const createAddress = async (
    req: UserRequest,
    res: Response
  ): Promise<any> => {
    try {
      logHttp("Creating Address");
      const address = await __db.address.create({
        data: {
          ...req.body,
          userId: req.user._id,
        },
      });
      logHttp("Created Address");

      return sendSuccessResponse({
        res,
        data: {
          address,
        },
      });
    } catch (error: any) {
      logError(`Error while getAvailableDays ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const getMyAddresses = async (
    req: UserRequest,
    res: Response
  ): Promise<any> => {
    try {
      logHttp("Getting My Addresses");
      const addresses = await __db.address.findMany({
        where: {
          userId: req.user._id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      logHttp("Getting My Addresses");

      return sendSuccessResponse({
        res,
        data: {
          addresses,
        },
      });
    } catch (error: any) {
      logError(`Error while getMyAddresses ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const getAddress = async (req: UserRequest, res: Response): Promise<any> => {
    try {
      logHttp("Getting My Address");
      const address = await __db.address.findFirst({
        where: {
          id: Number(req.params.id),
          userId: req.user._id,
        },
      });

      if (!address) throw new Error("No address found");

      logHttp("Getting My Address");

      return sendSuccessResponse({
        res,
        data: {
          address,
        },
      });
    } catch (error: any) {
      logError(`Error while getAddress ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const updateAddress = async (req: UserRequest, res: Response) => {
    try {
      logHttp("Getting Address");
      const address = await __db.address.findFirst({
        where: {
          id: Number(req.params.id),
          userId: req.user._id,
        },
      });
      if (!address) throw new Error("No address found");

      logHttp("Got Address");

      logHttp("Updating Address with body ", req.body);

      const data = await __db.address.update({
        where: {
          id: Number(req.params.id),
          userId: req.user._id,
        },
        data: {
          ...req.body,
        },
      });

      logHttp("Updated Address");

      return sendSuccessResponse({
        res,
        data: { address: data },
        message: "Updated address successfully!!!",
      });
    } catch (error) {
      logError(`Error while updateAddress ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const deleteAddress = async (req: UserRequest, res: Response) => {
    try {
      logHttp("Getting Address");
      const address = await __db.address.findFirst({
        where: {
          id: Number(req.params.id),
          userId: req.user._id,
        },
      });
      if (!address) throw new Error("No address found");

      logHttp("Got Address");

      logHttp("Deleting Address");

      const data = await __db.address.delete({
        where: {
          id: Number(req.params.id),
          userId: req.user._id,
        },
      });

      logHttp("Deleted Address");

      return sendSuccessResponse({
        res,
        data: { address: data },
        message: "Deleted address successfully!!!",
      });
    } catch (error) {
      logError(`Error while deleteAddress ==> `, error?.message);
      return sendErrorResponse({
        res,
        statusCode: error?.statusCode || 400,
        error,
      });
    }
  };

  const logHttp = (context: string, value?: any) =>
    logger.http(`Address - ${context} => ${JSON.stringify(value)}`);

  const logError = (context: string, value?: any) =>
    logger.error(`Address - ${context} => ${JSON.stringify(value)}`);

  return {
    createAddress,
    getMyAddresses,
    getAddress,
    updateAddress,
    deleteAddress,
  };
};

export default AddressController;
