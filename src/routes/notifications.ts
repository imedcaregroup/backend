import { Router } from "express";
import NotificationsController from "../controllers/notificationsController";

const router = Router();

const notificationsController = NotificationsController();

router.route("/").get(notificationsController.getNotifications);

router
  .route("/:notificationId/read")
  .patch(notificationsController.readNotification);

export default router;
