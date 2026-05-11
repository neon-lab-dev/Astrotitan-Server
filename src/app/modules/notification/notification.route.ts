// app/modules/notification/notification.route.ts
import express from "express";
import auth from "../../middlewares/auth";
import { NotificationController } from "./notification.controller";
import { UserRole } from "../accounts/accounts.constants";

const router = express.Router();

router.post("/send", auth(UserRole.admin, UserRole.user, UserRole.astrologer), NotificationController.sendNotification);
router.get("/my", auth(UserRole.admin, UserRole.user, UserRole.astrologer), NotificationController.getMyNotifications);
router.patch("/read/:id", auth(UserRole.admin, UserRole.user, UserRole.astrologer), NotificationController.markRead);

export const NotificationRoutes = router;