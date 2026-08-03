import express from "express";
import { ConsultationControllers } from "./consultation.controller";
import auth from "../../../middlewares/auth";
import { UserRole } from "../../accounts/accounts.constants";

const router = express.Router();

// User Routes
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

// Astrologer Routes
router.get(
    "/my-bookings",
    auth(UserRole.astrologer),
    ConsultationControllers.getMyConsultationBookings
);

router.patch(
    "/change-status/:consultationId",
    auth(UserRole.astrologer),
    ConsultationControllers.changeConsultationStatus
);

router.patch(
    "/end-session/:consultationId",
    auth(UserRole.astrologer, UserRole.user),
    ConsultationControllers.endConsultationSession
);

router.post(
    "/review/add/:consultationId",
    auth(UserRole.user),
    ConsultationControllers.addReview
);

router.post(
    '/schedule-meeting/:consultationId',
    auth(UserRole.astrologer),
    ConsultationControllers.scheduleMeeting
);

router.post(
    '/send-reschedule-request/:consultationId',
    auth(UserRole.user),
    ConsultationControllers.sendRescheduleRequest
);

router.patch(
    '/reschedule-meeting/:consultationId',
    auth(UserRole.astrologer),
    ConsultationControllers.rescheduleMeeting
);

// Common Routes (Both User and Astrologer)
router.get(
    "/:consultationId",
    auth(UserRole.user, UserRole.astrologer),
    ConsultationControllers.getSingleConsultation
);

router.post(
    '/add-recommendations/:consultationId',
    auth(UserRole.astrologer),
    ConsultationControllers.addRecommendations
);

export const ConsultationRoutes = router;