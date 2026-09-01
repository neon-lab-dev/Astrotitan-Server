import express from "express";

import { ConsultationControllers } from "./consultation.controller";
import auth from "../../../middlewares/auth";
import { UserRole } from "../../accounts/accounts.constants";

const router = express.Router();

// User routes
router.post(
  "/request",
  auth(UserRole.user),
  ConsultationControllers.requestConsultation
);

router.get(
  "/my-requests",
  auth(UserRole.user),
  ConsultationControllers.getMyConsultationRequests
);

router.post(
  "/send-reschedule-request/:consultationId",
  auth(UserRole.user),
  ConsultationControllers.sendRescheduleRequest
);

router.post(
  "/review/add/:consultationId",
  auth(UserRole.user),
  ConsultationControllers.addReview
);

// Astrologer routes
router.get(
  "/my-bookings",
  auth(UserRole.astrologer),
  ConsultationControllers.getMyConsultationBookings
);

router.post(
  "/schedule/:consultationId",
  auth(UserRole.astrologer),
  ConsultationControllers.scheduleConsultation
);

router.post(
  "/reject/:consultationId",
  auth(UserRole.astrologer),
  ConsultationControllers.rejectConsultation
);

router.patch(
  "/start/:consultationId",
  auth(UserRole.astrologer, UserRole.user),
  ConsultationControllers.startConsultation
);

router.patch(
  "/reschedule/:consultationId",
  auth(UserRole.astrologer),
  ConsultationControllers.rescheduleConsultation
);

router.post(
  "/add-recommendations/:consultationId",
  auth(UserRole.astrologer),
  ConsultationControllers.addRecommendations
);

// Common routes
router.get(
  "/join/:consultationId",
  auth(UserRole.user, UserRole.astrologer),
  ConsultationControllers.joinConsultation
);

router.patch(
  "/end-session/:consultationId",
  auth(UserRole.astrologer, UserRole.user),
  ConsultationControllers.endConsultationSession
);

router.get(
  "/:consultationId",
  auth(UserRole.user, UserRole.astrologer),
  ConsultationControllers.getSingleConsultation
);

export const ConsultationRoutes = router;