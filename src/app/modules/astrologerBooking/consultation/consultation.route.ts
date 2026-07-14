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

// Common Routes (Both User and Astrologer)
router.get(
    "/:consultationId",
    auth(UserRole.user, UserRole.astrologer),
    ConsultationControllers.getSingleConsultation
);


// user token
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTRkZTMxODkzNGMwZjVhYTYxMDc4MzEiLCJlbWFpbCI6InJhaHVsY2hhbmRyYXN1dHJhZGhhcjNAZ21haWwuY29tIiwicGhvbmVOdW1iZXIiOm51bGwsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzg0MDA4MDc2LCJleHAiOjE3ODQ2MTI4NzZ9.Rrc_GUmBzuNVHEv-VSUBqDHVI7OsUkYDEOFcy3qOvaA

// Astorloger token
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTM4YjhhYTBkZjhhMzZkZDc5MmI1ZGEiLCJlbWFpbCI6InJhaHVsc2QzODBAZ21haWwuY29tIiwicGhvbmVOdW1iZXIiOiIrOTE5ODc2NTQzMjE1Iiwicm9sZSI6ImFzdHJvbG9nZXIiLCJpYXQiOjE3ODQwMDgxNTAsImV4cCI6MTc4NDYxMjk1MH0.v8CvJMzTMqS3SjPc4aWN-anXSnot_R_vipWM1ass1Cw



// Call Routes
router.post(
    '/call/start',
    auth(UserRole.user, UserRole.astrologer),
    ConsultationControllers.startCall
);

router.post(
    '/call/accept',
    auth(UserRole.user, UserRole.astrologer),
    ConsultationControllers.acceptCall
);

router.post(
    '/call/reject',
    auth(UserRole.user, UserRole.astrologer),
    ConsultationControllers.rejectCall
);

router.post(
    '/call/end',
    auth(UserRole.user, UserRole.astrologer),
    ConsultationControllers.endCall
);

router.get(
    '/call/token/:consultationId',
    auth(UserRole.user, UserRole.astrologer),
    ConsultationControllers.getCallToken
);

router.get(
    '/call/status/:consultationId',
    auth(UserRole.user, UserRole.astrologer),
    ConsultationControllers.getCallStatus
);

export const ConsultationRoutes = router;