import { Router } from "express";
import SpecialOffersController from "../controllers/specialOffersController";
import { validationWrapper } from "../utils/helpers";
import { createSpecialOfferValidation } from "../validations/specialOfferValidation";

const router = Router();

const specialOffersController = SpecialOffersController();

router
  .route("/")
  .get(specialOffersController.getSpecialOffers)
  .post(
    createSpecialOfferValidation,
    validationWrapper(specialOffersController.createSpecialOffer),
  );
router
  .route("/:id")
  .get(specialOffersController.getSpecialOfferDetails)
  .put(specialOffersController.changeSpecialOfferStatus);

export default router;
