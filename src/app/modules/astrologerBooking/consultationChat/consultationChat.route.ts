import express from "express";
import { ConsultationChatControllers } from "./consultationChat.controller";
import auth from "../../../middlewares/auth";
import { UserRole } from "../../accounts/accounts.constants";

const router = express.Router();

// All routes require authentication
router.use(auth(UserRole.user, UserRole.astrologer));

// Get consultation chat list (inbox)
router.get("/chat-list", ConsultationChatControllers.getConsultationChatList);

// Get messages for a specific consultation
router.get("/messages/:consultationId", ConsultationChatControllers.getConsultationMessages);

// Mark messages as read in a consultation
router.patch("/read/:consultationId", ConsultationChatControllers.markConsultationMessagesAsRead);

export const ConsultationChatRoutes = router;