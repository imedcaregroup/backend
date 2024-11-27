import { Router } from "express";
import {
  createAddressValidation,
  updateAddressValidation,
} from "../validations/addressValidation";
import { validationWrapper } from "../utils/helpers";
import AddressController from "../controllers/address";

const addressController = AddressController();

const router = Router();

router
  .route("/")
  .post(
    createAddressValidation,
    validationWrapper(addressController.createAddress)
  )
  .get(addressController.getMyAddresses);

router
  .route("/:id")
  .get(addressController.getAddress)
  .patch(
    updateAddressValidation,
    validationWrapper(addressController.updateAddress)
  )
  .delete(addressController.deleteAddress);

export default router;
