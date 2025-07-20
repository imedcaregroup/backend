import { Router } from "express";
import AvailabilityController from "../controllers/availability";

const availabilityController = AvailabilityController();

const router = Router();

router.route("/days").get(availabilityController.getAvailableDays);
router.route("/time-slots").get(availabilityController.getTimeSlots);
router.route("/get-months").get(availabilityController.getMonths);
router
  .route("/getRemainingDaysAndSlots")
  .get(availabilityController.getRemainingDaysAndSlots);

export default router;
