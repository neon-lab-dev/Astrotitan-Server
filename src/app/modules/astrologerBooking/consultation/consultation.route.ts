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

// Common Routes (Both User and Astrologer)
router.get(
    "/:consultationId",
    auth(UserRole.user, UserRole.astrologer),
    ConsultationControllers.getSingleConsultation
);

export const ConsultationRoutes = router;